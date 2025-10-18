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
    RoomVisibility getRoomVisibility();
    RoomStatus getStatus();
    Integer getMaxParticipants();
    LocalDateTime getCreatedAt();
    LocalDateTime getExpiresAt();
    Long getTotalVisitors();
    Long getParticipantCount();
    Long getFileCount();
    Long getTotalDownloads();
}