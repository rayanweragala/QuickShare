package com.quickshare.backend.mapper;

import com.quickshare.backend.dto.room.FileInfo;
import com.quickshare.backend.dto.room.ParticipantInfo;
import com.quickshare.backend.dto.room.RoomResponse;
import com.quickshare.backend.entity.Room;
import com.quickshare.backend.entity.RoomFile;
import com.quickshare.backend.entity.RoomParticipant;
import com.quickshare.backend.model.room.RoomProjection;

public class RoomMapper {

    public static RoomResponse mapToRoomResponse(Room room) {
        return RoomResponse.builder()
                .id(room.getId())
                .roomCode(room.getRoomCode())
                .roomName(room.getRoomName())
                .roomIcon(room.getRoomIcon())
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
                .isFeatured(room.getIsFeatured())
                .build();
    }

    public static ParticipantInfo mapToParticipantInfo(RoomParticipant participant){
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

    public static FileInfo mapToFileInfo(RoomFile file){
        return FileInfo.builder()
                .fileId(file.getFileId())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .uploaderAnimalName(file.getUploaderAnimalName())
                .uploaderUserId(file.getUploaderUserId())
                .uploadedAt(file.getUploadedAt().toString())
                .downloadCount(file.getDownloadCount())
                .downloadUrl(file.getCloudFlareUrl())
                .isAvailable(file.getIsAvailable())
                .build();
    }

    public static RoomResponse mapToRoomResponse(RoomProjection projection) {
        return RoomResponse.builder()
                .id(projection.getId())
                .roomCode(projection.getRoomCode())
                .roomName(projection.getRoomName())
                .roomIcon(projection.getRoomIcon())
                .creatorAnimalName(projection.getCreatorAnimalName())
                .visibility(projection.getRoomVisibility())
                .status(projection.getStatus())
                .maxParticipants(projection.getMaxParticipants())
                .participantCount(projection.getParticipantCount() != null ? projection.getParticipantCount().intValue() : 0)
                .fileCount(projection.getFileCount() != null ? projection.getFileCount().intValue() : 0)
                .totalDownloads(projection.getTotalDownloads() != null ? projection.getTotalDownloads() : 0L)
                .totalVisitors(projection.getTotalVisitors() != null ? projection.getTotalVisitors() : 0L)
                .createdAt(projection.getCreatedAt() != null ? projection.getCreatedAt().toString() : null)
                .expiresAt(projection.getExpiresAt() != null ? projection.getExpiresAt().toString() : null)
                .currentStorageBytes(0L)
                .maxStorageBytes(0L)
                .creatorOnlyUpload(false)
                .isExpired(false)
                .isFull(false)
                .build();
    }
}