package com.quickshare.backend.dto.room;

import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Detailed information about a specific room")
public class RoomResponse {

    @Schema(description = "Unique database ID of the room")
    private Long id;

    @Schema(description = "Unique code used to join the room")
    private String roomCode;

    @Schema(description = "Display name of the room")
    private String roomName;

    @Schema(description = "Animal name representing the creator (used as anonymous nickname)")
    private String creatorAnimalName;

    @Schema(description = "Room visibility type (PUBLIC or PRIVATE)")
    private RoomVisibility visibility;

    @Schema(description = "Current room status (e.g., ACTIVE, EXPIRED, CLOSED)")
    private RoomStatus status;

    @Schema(description = "Current number of participants connected to the room")
    private Integer participantCount;

    @Schema(description = "Number of files currently uploaded in this room")
    private Integer fileCount;

    @Schema(description = "Current storage usage in bytes")
    private Long currentStorageBytes;

    @Schema(description = "Maximum allowed storage size for this room in bytes")
    private Long maxStorageBytes;

    @Schema(description = "Maximum allowed participants in this room")
    private Integer maxParticipants;

    @Schema(description = "If true, only the room creator can upload files")
    private Boolean creatorOnlyUpload;

    @Schema(description = "Room creation timestamp in ISO 8601 format")
    private String createdAt;

    @Schema(description = "Room expiration timestamp in ISO 8601 format")
    private String expiresAt;

    @Schema(description = "Total number of downloads across all files")
    private Long totalDownloads;

    @Schema(description = "Total number of unique visitors who joined this room")
    private Long totalVisitors;

    @Schema(description = "Base64-encoded QR code data for quick sharing")
    private String qrCodeData;

    @Schema(description = "Publicly shareable link to access this room")
    private String shareableLink;

    @Schema(description = "Indicates whether the room has expired")
    private Boolean isExpired;

    @Schema(description = "Indicates whether the room has reached participant capacity")
    private Boolean isFull;
}
