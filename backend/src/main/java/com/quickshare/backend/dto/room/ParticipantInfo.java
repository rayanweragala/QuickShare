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
@Schema(description = "Information about a participant connected to a room")
public class ParticipantInfo {

    @Schema(description = "Unique WebSocket ID for the participant connection")
    private String socketId;

    @Schema(description = "Randomly assigned anonymous animal name")
    private String animalName;

    @Schema(description = "Animal icon representing the participant avatar")
    private String animalIcon;

    @Schema(description = "Avatar color associated with this participant")
    private String avatarColor;

    @Schema(description = "True if this participant is the room creator")
    private Boolean isCreator;

    @Schema(description = "True if this participant is currently online")
    private Boolean isOnline;

    @Schema(description = "Timestamp when the participant joined the room")
    private String joinedAt;

    @Schema(description = "Last seen timestamp of the participant")
    private String lastSeenAt;
}
