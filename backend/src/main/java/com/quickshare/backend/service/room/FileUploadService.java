package com.quickshare.backend.service.room;

import com.quickshare.backend.component.RateLimitService;
import com.quickshare.backend.dto.room.FileInfo;
import com.quickshare.backend.dto.room.FileUploadResponse;
import com.quickshare.backend.dto.room.RoomDetailsResponse;
import com.quickshare.backend.dto.room.UploadFileRequest;
import com.quickshare.backend.entity.Room;
import com.quickshare.backend.entity.RoomFile;
import com.quickshare.backend.entity.RoomParticipant;
import com.quickshare.backend.handler.WebSocketHandler;
import com.quickshare.backend.model.enums.RoomVisibility;
import com.quickshare.backend.model.enums.SubscriptionTier;
import com.quickshare.backend.repository.RoomFileRepository;
import com.quickshare.backend.repository.RoomParticipantRepository;
import com.quickshare.backend.repository.RoomRepository;
import com.quickshare.backend.service.CacheService;
import com.quickshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileUploadService {
    private final RoomRepository roomRepository;
    private final RoomFileRepository fileRepository;
    private final CloudflareR2Service cloudflareR2Service;
    private final RateLimitService rateLimitService;
    private final UsageLimitService usageLimitService;
    private final RoomParticipantRepository participantRepository;
    private final CacheService cacheService;
    private final WebSocketHandler webSocketHandler;
    private final RoomCacheService roomCacheService;

    /**
     * PHASE 1: initiate file upload
     * - validates permissions and limits
     * - generates presigned upload URL
     * - returns URL to frontend for direct upload to R2
     */
    @Transactional
    public FileUploadResponse initiateFileUpload(String roomCode, UploadFileRequest request, String userId, String socketId, String ipAddress) {

        LoggerUtil.audit("Initiating file upload: " + request.getFileName() + " to room: " + roomCode);

        if(!rateLimitService.canUploadFile(userId)){
            throw new RuntimeException("daily file upload limit exceeded");
        }

        Room room = roomRepository.findByRoomCode(roomCode).orElseThrow(() -> new RuntimeException("room not found"));

        RoomParticipant participant = participantRepository
                .findByRoomIdAndUserId(room.getId(), userId)
                .orElseThrow(() -> new RuntimeException("You must join the room first"));


        if (room.getCreatorOnlyUpload() && !participant.getIsCreator()) {
            throw new RuntimeException("Only room creator can upload files");
        }

        if (!room.hasStorageSpace(request.getFileSize())) {
            throw new RuntimeException("Room storage limit exceeded. Current: " +
                    formatBytes(room.getCurrentStorageBytes()) + "/" +
                    formatBytes(room.getMaxStorageBytes()));
        }

        SubscriptionTier tier = room.getSubscriptionTier() != null ?
                room.getSubscriptionTier() : SubscriptionTier.FREE;

        if (request.getFileSize() > tier.getMaxFileSizeBytes()) {
            throw new RuntimeException("File exceeds maximum allowed size (" +
                    formatBytes(tier.getMaxFileSizeBytes()) + ") for " + tier + " tier");
        }

        String fileId = UUID.randomUUID().toString();
        String cloudflareKey = "rooms/" + room.getId() + "/" + fileId + "-" + request.getFileName();

        String uploadUrl = cloudflareR2Service.generatePresignedUploadUrl(cloudflareKey,request.getFileType());

        RoomFile pendingFile = RoomFile.builder()
                .fileId(fileId)
                .room(room)
                .fileName(request.getFileName())
                .fileType(request.getFileType())
                .fileSize(request.getFileSize())
                .cloudFlareKey(cloudflareKey)
                .cloudFlareUrl("")
                .uploaderAnimalName(participant.getAnimalName())
                .uploaderSocketId(socketId)
                .uploaderUserId(userId)
                .checksum(request.getChecksum())
                .isAvailable(false)
                .expiresAt(room.getExpiresAt())
                .build();

        fileRepository.save(pendingFile);

        cacheService.evictRoomCaches(room.getId());

        usageLimitService.trackFileUpload(userId,ipAddress);
        rateLimitService.trackAction(userId,"file_upload");

        LoggerUtil.audit("Upload URL generated for file: " + fileId);

        return FileUploadResponse.builder()
                .fileId(fileId)
                .fileName(request.getFileName())
                .uploadUrl(uploadUrl)
                .message("upload url generated. Upload your file to the provided URL")
                .build();
    }

    /**
     * PHASE 2: complete file upload
     * - verifies file was uploaded to R2
     * - makes file available for download
     * - updates room storage
     */
    @Transactional
    public FileInfo completeFileUpload(String roomCode, String fileId, String userId) {

        LoggerUtil.audit("Completing file upload: " + fileId);

        Room room = roomRepository.findByRoomCode(roomCode).orElseThrow(()-> new RuntimeException("room not found"));

        RoomFile file = fileRepository.findByFileId(fileId)
                .orElseThrow(() -> new RuntimeException("file not found"));

        if (!file.getUploaderUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You can only complete your own uploads");
        }

        if (!cloudflareR2Service.fileExists(file.getCloudFlareKey())) {
            throw new RuntimeException("file not found in storage. Upload may have failed.");
        }

        Long actualSize = cloudflareR2Service.getFileSize(file.getCloudFlareKey());
        if (!actualSize.equals(file.getFileSize())) {
            LoggerUtil.warn(FileUploadService.class,
                    "file size mismatch. Expected: " + file.getFileSize() + ", Actual: " + actualSize);
            file.setFileSize(actualSize);
        }

        String cloudflareUrl = cloudflareR2Service.getPublicUrl(file.getCloudFlareKey());
        file.setCloudFlareUrl(cloudflareUrl);
        file.setIsAvailable(true);

        fileRepository.save(file);

        room.addFiles(file);
        room.updateActivity();
        roomRepository.save(room);

        cacheService.evictRoomCaches(room.getId());
        cacheService.evictRoomDetails(room.getId());
        if (room.getRoomVisibility() == RoomVisibility.PUBLIC) {
            cacheService.evictPublicRoomsCache();
        }

        LoggerUtil.audit("file upload completed: " + fileId + " (" + formatBytes(actualSize) + ")");

        try {
            RoomDetailsResponse updatedRoom = roomCacheService.getRoomDetails(room.getId());
            webSocketHandler.broadcastRoomUpdate(roomCode, updatedRoom);
            LoggerUtil.dev("Broadcasted file upload completion to room=" + roomCode);
        } catch (Exception e) {
            LoggerUtil.error(FileUploadService.class,
                    "Failed to broadcast file upload completion=" + e.getMessage(), e);
        }

        return mapToFileInfo(file);
    }

    /**
     * get all files in a room
     */
    @Transactional(readOnly = true)
    public List<FileInfo> getRoomFiles(String roomCode) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("room not found"));

        return fileRepository.findByRoomIdOrderByUploadedAtDesc(room.getId())
                .stream()
                .filter(RoomFile::getIsAvailable)
                .map(this::mapToFileInfo)
                .collect(Collectors.toList());
    }

    /**
     * get download URL for a file
     */
    @Transactional
    public String getDownloadUrl(String roomCode, String fileId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("room not found"));

        RoomFile file = fileRepository.findByFileId(fileId)
                .orElseThrow(() -> new RuntimeException("file not found"));

        if (!file.getIsAvailable()) {
            throw new RuntimeException("file is not available yet");
        }

        if (file.isExpired()) {
            throw new RuntimeException("file has expired");
        }

        file.incrementDownloadCount();
        fileRepository.save(file);

        room.updateActivity();
        roomRepository.save(room);

        return cloudflareR2Service.generatePresignedDownloadUrl(file.getCloudFlareKey());
    }

    /**
     * delete a file
     */
    @Transactional
    public void deleteFile(String roomCode, String fileId, String userId) {
        Room room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("room not found"));

        RoomFile file = fileRepository.findByFileId(fileId)
                .orElseThrow(() -> new RuntimeException("file not found"));

        RoomParticipant participant = participantRepository
                .findByRoomIdAndUserId(room.getId(), userId)
                .orElse(null);

        boolean isUploader = file.getUploaderUserId().equals(userId);
        boolean isCreator = participant != null && participant.getIsCreator();

        if (!isUploader && !isCreator) {
            throw new RuntimeException("you can only delete your own files");
        }

        try {
            cloudflareR2Service.deleteFile(file.getCloudFlareKey());
            LoggerUtil.audit("Successfully deleted file from R2: " + fileId);
        } catch (Exception e) {
            LoggerUtil.error(FileUploadService.class,
                    "Failed to delete file from R2=" + file.getCloudFlareKey() + "," + e.getMessage(),e);
            throw new RuntimeException("Failed to delete file from storage: " + e.getMessage(), e);
        }

        room.removeFile(file);
        roomRepository.save(room);
        fileRepository.delete(file);

        cacheService.evictRoomCaches(room.getId());
        cacheService.evictRoomDetails(room.getId());
        if (room.getRoomVisibility() == RoomVisibility.PUBLIC) {
            cacheService.evictPublicRoomsCache();
        }

        LoggerUtil.audit("File deleted successfully=" + fileId);

        try {
            RoomDetailsResponse updatedRoom = roomCacheService.getRoomDetails(room.getId());
            webSocketHandler.broadcastRoomUpdate(roomCode, updatedRoom);
            LoggerUtil.dev("Broadcasted file deletion to room=" + roomCode);
        } catch (Exception e) {
            LoggerUtil.error(FileUploadService.class,
                    "Failed to broadcast file deletion=" + e.getMessage(), e);
        }
    }

    /**
    * cancel/cleanup incomplete upload
     */
    @Transactional
    public void cancelUpload(String fileId, String userId) {
        RoomFile file = fileRepository.findByFileId(fileId)
                .orElseThrow(() -> new RuntimeException("file not found"));

        Room room = file.getRoom();

        if (!file.getUploaderUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        try {
            if (cloudflareR2Service.fileExists(file.getCloudFlareKey())) {
                cloudflareR2Service.deleteFile(file.getCloudFlareKey());
            }
        } catch (Exception e) {
            LoggerUtil.warn(FileUploadService.class, "Failed to cleanup R2 file: " + e.getMessage());
        }

        fileRepository.delete(file);

        cacheService.evictRoomCaches(room.getId());
        cacheService.evictRoomDetails(room.getId());

        LoggerUtil.audit("Upload cancelled: " + fileId);
    }

    private FileInfo mapToFileInfo(RoomFile file) {
        return FileInfo.builder()
                .fileId(file.getFileId())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .uploaderAnimalName(file.getUploaderAnimalName())
                .uploadedAt(file.getUploadedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .downloadCount(file.getDownloadCount())
                .downloadUrl(file.getCloudFlareUrl())
                .isAvailable(file.getIsAvailable() && !file.isExpired())
                .build();
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
