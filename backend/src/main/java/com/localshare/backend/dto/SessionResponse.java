package com.localshare.backend.dto;

import com.localshare.backend.model.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * response object for session-related API endpoints
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {
    private String sessionId;
    private SessionStatus status;
    private String message;
    private Boolean bothConnected;
    private String createdAt;
    private String qrCodeData;
    private Boolean isMultiRecipient;

    public static SessionResponse error(String message){
        return SessionResponse.builder()
                .status(SessionStatus.ERROR)
                .message(message)
                .build();
    }
}
