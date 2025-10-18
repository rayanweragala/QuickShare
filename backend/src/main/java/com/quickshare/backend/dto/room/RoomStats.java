package com.quickshare.backend.dto.room;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Aggregated metrics and activity data for a room")
public class RoomStats {

    @Schema(description = "Total number of files uploaded to the room")
    private Integer totalFiles;

    @Schema(description = "Total storage used in bytes")
    private Long totalStorageUsed;

    @Schema(description = "Total number of file downloads in this room")
    private Long totalDownloads;

    @Schema(description = "Total number of unique visitors who have joined")
    private Long totalVisitors;

    @Schema(description = "Number of currently active participants")
    private Integer activeParticipants;

    @Schema(description = "Timestamp of the last activity in the room")
    private String lastActivity;
}