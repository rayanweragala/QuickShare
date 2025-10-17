package com.quickshare.backend.model.room;

import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;

import java.time.LocalDateTime;

public interface RoomProjection {
    Long getId();
    String getRoomCode();
    String getRoomName();
    String getRoomIcon();
    String getCreatorAnimalName();
    RoomStatus getStatus();
    Integer getParticipantCount();
    Integer getFileCount();
    Long getCurrentStorageBytes();
    Long getMaxStorageBytes();
    Integer getMaxParticipants();

    LocalDateTime getCreatedAt();
    LocalDateTime getExpiresAt();
    Long getTotalDownloads();
    Long getTotalVisitors();
    Boolean getIsFeatured();
    RoomVisibility getRoomVisibility();
}