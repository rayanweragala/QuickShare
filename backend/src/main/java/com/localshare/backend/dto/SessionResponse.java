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

    public static SessionResponse created(String sessionId, String qrCodeData){
        return SessionResponse.builder()
                .sessionId(sessionId)
                .status(SessionStatus.WAITING)
                .message("session created successfully")
                .bothConnected(false)
                .qrCodeData(qrCodeData)
                .build();
    }

    public static SessionResponse joined(String sessionId){
        return SessionResponse.builder()
                .sessionId(sessionId)
                .status(SessionStatus.CONNECTED)
                .message("successfully joined session")
                .bothConnected(true)
                .build();
    }

    public static SessionResponse error(String message){
        return SessionResponse.builder()
                .status(SessionStatus.ERROR)
                .message(message)
                .build();
    }
}
