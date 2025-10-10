package com.localshare.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * file sharing session between two peers
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Session implements Serializable {
    private String sessionId;
    private String senderSocketId;
    private String receiverSocketId;
    private SessionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastActivityAt;
    private Integer totalFiles;
    private Integer completedFiles;
    private String senderIp;
    private String receiverIp;
    public boolean isBothConnected(){
        return senderSocketId != null && receiverSocketId != null;
    }
    public boolean isExpired(int timeOutMinutes){
        if(lastActivityAt == null) {
            return true;
        }
        LocalDateTime expiryTime = lastActivityAt.plusMinutes(timeOutMinutes);
        return LocalDateTime.now().isAfter(expiryTime);
    }
    public void updateActivity(){
        this.lastActivityAt = LocalDateTime.now();
    }
}
