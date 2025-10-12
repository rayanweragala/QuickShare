package com.localshare.backend.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.localshare.backend.dto.SignalingMessage;
import com.localshare.backend.model.Session;
import com.localshare.backend.model.SessionStatus;
import com.localshare.backend.service.SessionService;
import com.localshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Spring WebSocket handler for real-time signaling
 * Manages WebSocket connections and routes WebRTC signaling messages
 */
@Component
@RequiredArgsConstructor
public class WebSocketHandler extends TextWebSocketHandler {

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    private final Map<String, Map<String, WebSocketSession>> sessionConnections = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, Map<String, String>> sessionMetadata = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String sessionId = extractParam(query, "sessionId");
        String role = extractParam(query, "role");

        if (sessionId != null && role != null) {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("sessionId", sessionId);
            metadata.put("role", role);
            sessionMetadata.put(session, metadata);

            String connectionKey = role;
            if ("receiver".equalsIgnoreCase(role)) {
                connectionKey = role + "-" + session.getId().substring(0, 8);
            }

            sessionConnections.computeIfAbsent(sessionId, k -> new ConcurrentHashMap<>())
                    .put(connectionKey, session);

            if ("sender".equalsIgnoreCase(role)) {
                sessionService.updateSenderSocketId(sessionId.toUpperCase(), session.getId());
            } else if ("receiver".equalsIgnoreCase(role)) {
                sessionService.updateReceiverSocketId(sessionId.toUpperCase(), session.getId());
            }

            LoggerUtil.audit("WebSocket connected for sessionId=" + sessionId + ",role=" + role);
        }
    }
        @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Map<String, String> metadata = sessionMetadata.get(session);
            if (metadata == null) {
                return;
            }

            String sessionId = metadata.get("sessionId");
            String role = metadata.get("role");

            SignalingMessage signalingMsg = objectMapper.readValue(message.getPayload(), SignalingMessage.class);
            signalingMsg.setSessionId(sessionId);

            String type = signalingMsg.getType();

            switch (type) {
                case "offer":
                    handleOffer(sessionId, session, signalingMsg);
                    break;
                case "answer":
                    handleAnswer(sessionId, session, signalingMsg);
                    break;
                case "ice-candidate":
                    handleIceCandidate(sessionId, session, signalingMsg, role);
                    break;
                case "peer-ready":
                    handlePeerReady(sessionId, session, signalingMsg);
                    break;
                case "transfer-start":
                    handleTransferStart(sessionId, signalingMsg);
                    break;
                case "transfer-complete":
                    handleTransferComplete(sessionId, signalingMsg);
                    break;
                case "broadcast-status:" :
                    handleBroadcastStatus(sessionId,signalingMsg);
                default:
                    LoggerUtil.warn(WebSocketHandler.class, "Unknown message type: " + type);
            }
        } catch (Exception e) {
            LoggerUtil.error(WebSocketHandler.class, "Error handling WebSocket message: " + e.getMessage(), e);
        }
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Map<String, String> metadata = sessionMetadata.remove(session);
        if (metadata != null) {
            String sessionId = metadata.get("sessionId");
            String role = metadata.get("role");

            Session dbSession = sessionService.getSession(sessionId);

            if("receiver".equalsIgnoreCase(role) && dbSession != null && dbSession.isMultiRecipient()) {
                sessionService.removeReceiver(sessionId, session.getId());

                notifyReceiverDisconnected(sessionId, session.getId());

            } else {
                sessionService.updateSessionStatus(sessionId, SessionStatus.EXPIRED);
                notifyPeerDisconnected(sessionId);
            }

            sessionConnections.computeIfPresent(sessionId, (k, v) -> {
                v.values().remove(session);
                return v.isEmpty() ? null : v;
            });

            LoggerUtil.audit("WebSocket disconnected for sessionId=" + sessionId + ",role=" + role);
        }
    }
    private void handleOffer(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);

        if(session.isMultiRecipient()){
            Set<String> receiverSocketIds = session.getReceiverSocketIds();
            if(receiverSocketIds == null || receiverSocketIds.isEmpty()){
                sendError(sender,"no receivers connected");
                return;
            }

            Map<String,WebSocketSession> connections = sessionConnections.get(sessionId);
            for (String receiverId: receiverSocketIds){
                for(Map.Entry<String, WebSocketSession> entry : connections.entrySet()) {
                    if(entry.getKey().startsWith("receiver") && entry.getValue().getId().equals(receiverId)){
                        message.setFrom(sender.getId());
                        message.setTo(entry.getValue().getId());
                        entry.getValue().sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                    }
                }
            }
            LoggerUtil.audit("offer broadcast to " + receiverSocketIds.size() + " receivers");
        } else {
            if (session.getReceiverSocketId() == null) {
                sendError(sender, "receiver not connected");
                return;
            }

            WebSocketSession receiverSession = sessionConnections.get(sessionId).get("receiver");
            if (receiverSession != null && receiverSession.isOpen()) {
                message.setFrom(sender.getId());
                message.setTo(receiverSession.getId());
                receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                LoggerUtil.audit("offer routed to receiver for sessionId=" + sessionId);
            }
        }
    }

    private void handleAnswer(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        if (session == null || session.getSenderSocketId() == null) {
            sendError(sender, "sender not connected");
            return;
        }

        WebSocketSession senderSession = sessionConnections.get(sessionId).get("sender");
        if (senderSession != null && senderSession.isOpen()) {
            message.setFrom(sender.getId());
            message.setTo(senderSession.getId());
            senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            LoggerUtil.audit("answer routed to sender for sessionId=" + sessionId);
        }
    }

    private void handleBroadcastStatus(String sessionId, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        if(session == null){
            return;
        }

        Map<String,Object> statusData = new HashMap<>();
        statusData.put("totalReceivers",session.getReceiverSocketIds() != null ? session.getReceiverSocketIds().size() : 0);
        statusData.put("receiverProgress", session.getReceiverProgress());

        message.setData(statusData);
        WebSocketSession senderSession = sessionConnections.get(sessionId).get("sender");
        if(senderSession != null && senderSession.isOpen()) {
            senderSession.sendMessage(
                    new TextMessage(objectMapper.writeValueAsString(message))
            );
        }
    }
    private void handleIceCandidate(String sessionId, WebSocketSession sender, SignalingMessage message, String role) throws IOException {
        Session session = sessionService.getSession(sessionId);
        if (session == null) {
            return;
        }

        String targetRole = "sender".equalsIgnoreCase(role) ? "receiver" : "sender";
        WebSocketSession targetSession = sessionConnections.get(sessionId).get(targetRole);

        if (targetSession != null && targetSession.isOpen()) {
            message.setFrom(sender.getId());
            message.setTo(targetSession.getId());
            targetSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            LoggerUtil.dev("ice candidate routed for sessionId=" + sessionId);
        }
    }

    private void handlePeerReady(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        if (session == null || session.getSenderSocketId() == null) {
            sendError(sender, "sender not connected");
            return;
        }

        WebSocketSession senderSession = sessionConnections.get(sessionId).get("sender");
        if (senderSession != null && senderSession.isOpen()) {
            message.setFrom(sender.getId());
            message.setTo(senderSession.getId());
            senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            LoggerUtil.audit("peer-ready signal routed to sender for sessionId=" + sessionId);
        }
    }

    private void handleTransferStart(String sessionId, SignalingMessage message) throws IOException {
        sessionService.updateSessionStatus(sessionId, SessionStatus.TRANSFERRING);

        Map<String, WebSocketSession> connections = sessionConnections.get(sessionId);
        if (connections != null) {
            for (WebSocketSession session : connections.values()) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
            }
        }

        LoggerUtil.audit("file transfer started for sessionId=" + sessionId);
    }

    private void handleTransferComplete(String sessionId, SignalingMessage message) throws IOException {
        sessionService.updateSessionStatus(sessionId, SessionStatus.CONNECTED);

        Map<String, WebSocketSession> connections = sessionConnections.get(sessionId);
        if (connections != null) {
            for (WebSocketSession session : connections.values()) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
            }
        }

        LoggerUtil.audit("file transfer completed for sessionId=" + sessionId);
    }

    private void notifyPeerDisconnected(String sessionId) {
        Map<String, WebSocketSession> connections = sessionConnections.get(sessionId);
        if (connections != null) {
            SignalingMessage disconnectMsg = SignalingMessage.builder()
                    .type("peer-disconnected")
                    .sessionId(sessionId)
                    .message("the other peer has disconnected")
                    .timestamp(System.currentTimeMillis())
                    .build();

            for (WebSocketSession session : connections.values()) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(disconnectMsg)));
                    } catch (IOException e) {
                        LoggerUtil.error(WebSocketHandler.class, "Failed to send disconnect notification: " + e.getMessage(), e);
                    }
                }
            }
        }
    }

    private void notifyReceiverDisconnected(String sessionId, String receiverSocketId) {
        WebSocketSession senderSession = sessionConnections.get(sessionId).get("sender");

        if(senderSession != null && senderSession.isOpen()) {
            SignalingMessage msg = SignalingMessage.builder()
                    .type("receiver-disconnected")
                    .sessionId(sessionId)
                    .data(Map.of("receiverId", receiverSocketId))
                    .message("A receiver disconnected")
                    .timestamp(System.currentTimeMillis())
                    .build();

            try {
                senderSession.sendMessage(
                        new TextMessage(objectMapper.writeValueAsString(msg))
                );
            } catch (IOException e) {
                LoggerUtil.error(WebSocketHandler.class,
                        "Failed to send receiver disconnect: " + e.getMessage(), e);
            }
        }
    }
    private void sendError(WebSocketSession session, String error) {
        try {
            SignalingMessage errorMsg = SignalingMessage.builder()
                    .type("error")
                    .message(error)
                    .timestamp(System.currentTimeMillis())
                    .build();
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(errorMsg)));
        } catch (IOException e) {
            LoggerUtil.error(WebSocketHandler.class, "Failed to send error: " + e.getMessage(), e);
        }
    }

    private String extractParam(String query, String paramName) {
        if (query == null) return null;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=");
            if (keyValue.length == 2 && keyValue[0].equals(paramName)) {
                return keyValue[1];
            }
        }
        return null;
    }
}
