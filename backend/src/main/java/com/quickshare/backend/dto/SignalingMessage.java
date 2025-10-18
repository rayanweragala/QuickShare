package com.quickshare.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebRTC signalling message exchanged between peers to help establish a p2p connection
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignalingMessage {

    private String type;
    private String sessionId;
    private Object sdp;
    private Object candidate;
    private String from;
    private String to;
    private String message;
    private Long timestamp;
    private Object data;
}
