package com.quickshare.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.quickshare.backend.model.enums.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * file sharing session between two peers
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
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

    @Builder.Default
    private Set<String> receiverSocketIds = new HashSet<>();

    @Builder.Default
    private Map<String, String> receiverIps = new HashMap<>();

    @Builder.Default
    private Map<String, Integer> receiverProgress = new HashMap<>();

    @Builder.Default
    private int maxReceivers = 10;

    private boolean isMultiRecipient;

    public boolean isBothConnected(){
        if(isMultiRecipient) {
            return senderSocketId != null && receiverSocketIds != null && !receiverSocketIds.isEmpty();
        }
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
    public void addReceiverIp(String receiverId, String ip) {
        if (receiverIps == null) {
            receiverIps = new HashMap<>();
        }
        if (receiverId != null && ip != null) {
            receiverIps.put(receiverId, ip);
        }
    }
    public void updateReceiverProgress(String receiverId, int progress) {
        if (receiverProgress == null) {
            receiverProgress = new HashMap<>();
        }
        if (receiverId != null) {
            receiverProgress.put(receiverId, progress);
        }
    }
    public void removeReceiver(String receiverId) {
        if (receiverSocketIds != null) {
            receiverSocketIds.remove(receiverId);
        }
        if (receiverIps != null) {
            receiverIps.remove(receiverId);
        }
        if (receiverProgress != null) {
            receiverProgress.remove(receiverId);
        }
    }
}