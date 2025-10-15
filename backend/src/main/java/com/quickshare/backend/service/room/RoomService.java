package com.quickshare.backend.service.room;

import com.quickshare.backend.component.RateLimitService;
import com.quickshare.backend.dto.room.*;
import com.quickshare.backend.entity.Room;
import com.quickshare.backend.entity.RoomFile;
import com.quickshare.backend.entity.RoomParticipant;
import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import com.quickshare.backend.repository.RoomParticipantRepository;
import com.quickshare.backend.repository.RoomRepository;
import com.quickshare.backend.util.AnimalNameGenerator;
import com.quickshare.backend.util.LoggerUtil;
import com.quickshare.backend.util.StringUtilities;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final RateLimitService rateLimitService;
    private final UsageLimitService usageLimitService;
    private final StringUtilities stringUtilities;
    private final CloudflareR2Service cloudflareR2Service;

    @Transactional
    public RoomResponse createRoom(CreateRoomRequest request, String userUuid, String ipAddress) {
        if(!rateLimitService.canCreateRoom(userUuid)) {
            throw new RuntimeException("room creation limit exceeded for today");
        }

        usageLimitService.trackRoomCreation(userUuid,ipAddress);
        String roomCode = stringUtilities.generateUniqueRoomCode();
        var animalIdentity = AnimalNameGenerator.generateRandomAnimal();

        RoomVisibility visibility = request.getVisibility() != null ? request.getVisibility() : RoomVisibility.PRIVATE;

        int expirationHours = request.getExpirationHours() != null ? request.getExpirationHours() : 24;

        String roomName = request.getCustomRoomName() != null ? request.getCustomRoomName() : animalIdentity.getName() + "'s Room";

        Room room = Room.builder()
                .roomCode(roomCode)
                .roomName(roomName)
                .roomIcon(animalIdentity.getIcon())
                .creatorAnimalName(animalIdentity.getName())
                .creatorSocketId("")
                .creatorIp(ipAddress)
                .roomVisibility(visibility)
                .status(RoomStatus.ACTIVE)
                .maxStorageBytes(request.getMaxStorageBytes() != null ? request.getMaxStorageBytes() : 5368709120L)
                .maxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 10)
                .creatorOnlyUpload(request.getCreatorOnlyUpload() != null ? request.getCreatorOnlyUpload() : false)
                .expirationHours(expirationHours)
                .expiresAt(LocalDateTime.now().plusHours(expirationHours))
                .lastActivityAt(LocalDateTime.now())
                .totalVisitors(1L)
                .build();

        room = roomRepository.save(room);
        return mapToRoomResponse(room);
    }

    @Transactional
    public RoomDetailsResponse joinRoom(String roomCode, String userUuid, String socketId, String ipAddress) {
        Room room = roomRepository.findByRoomCode(roomCode).orElseThrow(() -> new RuntimeException("room not found"));

        if(room.isExpired()) {
            room.setStatus(RoomStatus.EXPIRED);
            roomRepository.save(room);
            throw new RuntimeException("room has expired");
        }

        if(room.isFull()){
            throw new RuntimeException("room is full");
        }

        Set<String> existingNames = room.getParticipants().stream().map(RoomParticipant::getAnimalName).collect(Collectors.toSet());
        var animalIdentity =  AnimalNameGenerator.generateUniqueAnimal(existingNames);

        RoomParticipant roomParticipant = RoomParticipant.builder()
                .room(room)
                .socketId(socketId)
                .animalName(animalIdentity.getName())
                .animalIcon(animalIdentity.getIcon())
                .avatarColor(animalIdentity.getColor())
                .ipAddress(ipAddress)
                .isCreator(false)
                .isOnline(true)
                .build();

        room.addParticipant(roomParticipant);
        room.setTotalVisitors(room.getTotalVisitors() + 1);
        room.updateActivity();

        roomRepository.save(room);

        return getRoomDetails(room.getId());
    }

    @Transactional(readOnly = true)
    public RoomDetailsResponse getRoomDetails(Long roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("room not found"));

        List<ParticipantInfo> participants = room.getParticipants().stream().map(this::mapToParticipantInfo).collect(Collectors.toList());

        List<FileInfo> files = room.getFiles().stream().map(this::mapToFileInfo).collect(Collectors.toList());

        RoomStats stats = RoomStats.builder()
                .totalFiles(files.size())
                .totalStorageUsed(room.getCurrentStorageBytes())
                .totalDownloads(files.stream().mapToLong(FileInfo::getDownloadCount).sum())
                .totalVisitors(room.getTotalVisitors())
                .activeParticipants(room.getParticipants().stream().filter(RoomParticipant::getIsOnline).toList().size())
                .lastActivity(room.getLastActivityAt() != null ? room.getLastActivityAt().toString() : null)
                .build();

        return RoomDetailsResponse.builder()
                .room(mapToRoomResponse(room))
                .participants(participants)
                .files(files)
                .stats(stats)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<RoomResponse> getPublicRooms(Pageable pageable) {
        return roomRepository.findPublicRooms(RoomVisibility.PUBLIC, RoomStatus.ACTIVE, pageable).map(this::mapToRoomResponse);
    }

    @Transactional(readOnly = true)
    public Page<RoomResponse> searchPublicRooms(String search, Pageable pageable) {
        return roomRepository.searchPublicRooms(RoomVisibility.PUBLIC, RoomStatus.ACTIVE, search, pageable)
                .map(this::mapToRoomResponse);
    }

    @Transactional
    public void leaveRoom(Long roomId, String socketId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("room not found"));

        RoomParticipant participant = participantRepository.findByRoomIdAndSocketId(roomId, socketId)
                .orElseThrow(() -> new RuntimeException("participant not found"));

        participant.setLeftAt(LocalDateTime.now());
        participant.setIsOnline(false);

        room.removeParticipant(participant);
        room.updateActivity();

        roomRepository.save(room);
    }

    @Transactional
    public void deleteRoom(Long roomId, String userUuid) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("room not found"));

        room.setStatus(RoomStatus.DELETED);
        roomRepository.save(room);
    }

    @Transactional
    public void updateActivity(Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("room not found"));
        room.updateActivity();
        roomRepository.save(room);
    }

    private RoomResponse mapToRoomResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .creatorAnimalName(room.getCreatorAnimalName())
                .visibility(room.getRoomVisibility())
                .status(room.getStatus())
                .participantCount(room.getParticipants().size())
                .fileCount(room.getFiles().size())
                .currentStorageBytes(room.getCurrentStorageBytes())
                .maxStorageBytes(room.getMaxStorageBytes())
                .creatorOnlyUpload(room.getCreatorOnlyUpload())
                .createdAt(room.getCreatedAt().toString())
                .expiresAt(room.getExpiresAt().toString())
                .totalDownloads(room.getFiles().stream().mapToLong(RoomFile::getDownloadCount).sum())
                .totalVisitors(room.getTotalVisitors())
                .isExpired(room.isExpired())
                .isFull(room.isFull())
                .build();
    }

    private ParticipantInfo mapToParticipantInfo(RoomParticipant participant){
        return ParticipantInfo.builder()
                .socketId(participant.getSocketId())
                .animalName(participant.getAnimalName())
                .animalIcon(participant.getAnimalIcon())
                .avatarColor(participant.getAvatarColor())
                .isCreator(participant.getIsCreator())
                .isOnline(participant.getIsOnline())
                .joinedAt(participant.getJoinedAt().toString())
                .lastSeenAt(participant.getLastSeenAt() != null ? participant.getLastSeenAt().toString() : null)
                .build();
    }

    private FileInfo mapToFileInfo(RoomFile file){
        return FileInfo.builder()
                .fileId(file.getFileId())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .uploaderAnimalName(file.getUploaderAnimalName())
                .uploadedAt(file.getUploadedAt().toString())
                .downloadCount(file.getDownloadCount())
                .downloadUrl(file.getCloudFlareUrl())
                .isAvailable(file.getIsAvailable())
                .build();
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void expireExpiredRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<Room> expiredRooms = roomRepository.findExpiredRooms(now,RoomStatus.ACTIVE);

        for(Room room : expiredRooms) {
            LoggerUtil.audit("auto-expiring room=" + room.getRoomCode() + " (expired at " + room.getExpiresAt() + ")");

            room.setStatus(RoomStatus.EXPIRED);
            room.getFiles().forEach(file -> {
                try {
                    cloudflareR2Service.deleteFile(file.getCloudFlareKey());
                }catch (Exception ex){
                    LoggerUtil.warn(RoomService.class,"failed to delete file=" + file.getCloudFlareKey() + "," + ex.getMessage());
                }
            });

            room.getFiles().clear();
            room.getParticipants().clear();

            roomRepository.save(room);
        }

        if(!expiredRooms.isEmpty()) {
            LoggerUtil.audit("expired " + expiredRooms.size() + ",rooms in batch");
        }
    }
}
