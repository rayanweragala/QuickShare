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
@Schema(description = "Data for patch room details")
public class RoomUpdateRequest {

    @Schema(description = "Display name of the room")
    private String roomName;

    @Schema(description = "Mark room as featured or not")
    private Boolean isFeatured;
}
