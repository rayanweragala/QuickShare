package com.quickshare.backend.dto.room;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for joining an existing room")
public class JoinRoomRequest {

    @NotBlank(message = "Socket ID is required")
    @Schema(description = "Unique socket identifier for the participant connection",
            example = "socket-789-ghi")
    private String socketId;
}

