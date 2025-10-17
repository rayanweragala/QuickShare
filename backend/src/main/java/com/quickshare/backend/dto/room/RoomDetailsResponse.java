package com.quickshare.backend.dto.room;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Full details of a room, including participants, files, and statistics")
public class RoomDetailsResponse {

    @Schema(description = "Basic information about the room")
    private RoomResponse room;

    @Schema(description = "List of participants currently or previously in the room")
    private List<ParticipantInfo> participants;

    @Schema(description = "List of files available in the room")
    private List<FileInfo> files;

    @Schema(description = "Aggregated room statistics")
    private RoomStats stats;
}
