package com.quickshare.backend.handler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quickshare.backend.dto.SignalingMessage;
import com.quickshare.backend.dto.room.RoomResponse;
import com.quickshare.backend.model.Session;
import com.quickshare.backend.model.enums.SessionStatus;
import com.quickshare.backend.service.SessionService;
import com.quickshare.backend.service.room.RoomService;
import com.quickshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * spring WebSocket handler for real-time signaling
 * manages WebSocket connections and routes WebRTC signaling messages
 */
@Component
public class WebSocketHandler extends TextWebSocketHandler {

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    private final Map<String, WebSocketSession> socketIdToSession = new ConcurrentHashMap<>();
    private final Map<WebSocketSession, Map<String, String>> sessionMetadata = new ConcurrentHashMap<>();
    private final Map<String, Object> sessionLocks = new ConcurrentHashMap<>();

    private final Map<String,Set<String >> roomSubscriptions = new ConcurrentHashMap<>();
    private final Map<String,String > socketToRoom = new ConcurrentHashMap<>();

    private final Map<String, Set<String>> userFeaturedRoomsSubscriptions = new ConcurrentHashMap<>();
    private final Map<String, String> socketToUserId = new ConcurrentHashMap<>();
    private final RoomService roomService;

    public WebSocketHandler(
            SessionService sessionService,
            ObjectMapper objectMapper,
            @Lazy RoomService roomService) {
        this.sessionService = sessionService;
        this.objectMapper = objectMapper;
        this.roomService = roomService;
    }
    private Object getSessionLock(String sessionId) {
        return sessionLocks.computeIfAbsent(sessionId, k -> new Object());
    }
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String query = session.getUri().getQuery();
        String sessionId = extractParam(query, "sessionId");
        String role = extractParam(query, "role");
        String roomCode = extractParam(query, "roomCode");
        String userId = extractParam(query, "userId");
        String type = extractParam(query, "type");

        if (userId != null && "featured".equals(type)) {
            socketIdToSession.put(session.getId(), session);
            userFeaturedRoomsSubscriptions
                    .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                    .add(session.getId());
            socketToUserId.put(session.getId(), userId);

            Map<String, String> metadata = new HashMap<>();
            metadata.put("type", "featured");
            metadata.put("userId", userId);
            sessionMetadata.put(session, metadata);

            sendFeaturedRoomsToUser(session, userId);

            LoggerUtil.audit("Featured rooms WebSocket connected for userId=" + userId);
            return;
        }

        if (roomCode != null) {
            Map<String, String> metaData = new HashMap<>();
            metaData.put("type", "room");
            metaData.put("roomCode", roomCode);
            sessionMetadata.put(session, metaData);

            socketIdToSession.put(session.getId(), session);

            roomSubscriptions.computeIfAbsent(roomCode, k -> ConcurrentHashMap.newKeySet())
                    .add(session.getId());
            socketToRoom.put(session.getId(), roomCode);

            LoggerUtil.audit("WebSocket connected for room subscriptions, roomCode=" + roomCode +
                    ",socketId=" + session.getId());
            return;
        }

        if (sessionId != null && role != null) {
            Map<String, String> metadata = new HashMap<>();
            metadata.put("sessionId", sessionId);
            metadata.put("role", role);
            sessionMetadata.put(session, metadata);

            socketIdToSession.put(session.getId(), session);

            Session dbSession = sessionService.getSession(sessionId.toUpperCase());

            if ("sender".equalsIgnoreCase(role)) {
                sessionService.updateSenderSocketId(sessionId.toUpperCase(), session.getId());
            } else if ("receiver".equalsIgnoreCase(role)) {
                if (dbSession != null && dbSession.isMultiRecipient()) {
                    sessionService.updateReceiverSocketIdInBroadcast(
                            sessionId.toUpperCase(), null, session.getId());
                } else {
                    sessionService.updateReceiverSocketId(sessionId.toUpperCase(), session.getId());
                }
            }

            LoggerUtil.audit("WebSocket connected for sessionId=" + sessionId +
                    ",role=" + role + ",socketId=" + session.getId());
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        try {
            Map<String, String> metadata = sessionMetadata.get(session);
            if (metadata == null) {
                return;
            }

            String metadataType = metadata.get("type");

            if ("room".equals(metadataType)) {
                handleRoomMessage(session, message);
                return;
            }

            if ("featured".equals(metadataType)) {
                handleFeaturedRoomsMessage(session, message);
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
                case "broadcast-status":
                    handleBroadcastStatus(sessionId, signalingMsg);
                    break;
                default:
                    LoggerUtil.warn(WebSocketHandler.class, "Unknown message type=" + type);
            }
        } catch (Exception e) {
            LoggerUtil.error(WebSocketHandler.class, "Error handling WebSocket message=" + e.getMessage(), e);
        }
    }

    private void handleRoomMessage(WebSocketSession session, TextMessage message) throws IOException {
        try {
            Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) msg.get("type");

            if ("ping".equals(type)) {
                Map<String, Object> pong = new HashMap<>();
                pong.put("type", "pong");
                pong.put("timestamp", System.currentTimeMillis());
                session.sendMessage(new TextMessage(objectMapper.writeValueAsString(pong)));
            }
        } catch (Exception e) {
            LoggerUtil.error(WebSocketHandler.class,
                    "Error handling room message=" + e.getMessage(), e);
        }
    }

    private void handleFeaturedRoomsMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<String, Object> msg = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) msg.get("type");
            String userId = socketToUserId.get(session.getId());

            if (userId == null) {
                userId = (String) msg.get("userId");
                if (userId != null) {
                    socketToUserId.put(session.getId(), userId);
                } else {
                    LoggerUtil.error(WebSocketHandler.class, "UserId not found for session", null);
                    return;
                }
            }

            LoggerUtil.audit("Received featured rooms message type=" + type + " for userId=" + userId);


            switch (type) {
                case "request-featured-rooms":
                    sendFeaturedRoomsToUser(session, userId);
                    break;
                case "toggle-featured":
                    Long roomId = ((Number) msg.get("roomId")).longValue();
                    Boolean isFeatured = (Boolean) msg.get("isFeatured");
                    roomService.toggleRoomFeatured(roomId, userId, isFeatured);
                    sendFeaturedRoomsToUser(session, userId);
                    break;
                case "ping":
                    Map<String, Object> pong = new HashMap<>();
                    pong.put("type", "pong");
                    pong.put("timestamp", System.currentTimeMillis());
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(pong)));
                    break;
                default:
                    LoggerUtil.dev("Unknown featured rooms message type=" + type);
            }
        } catch (Exception e) {
            LoggerUtil.error(WebSocketHandler.class,
                    "Error handling featured rooms message=" + e.getMessage(), e);
        }
    }

    private void sendFeaturedRoomsToUser(WebSocketSession session, String userId) {
        try {
            List<RoomResponse> rooms = roomService.getFeaturedRoomsForUser(userId);

            Map<String, Object> message = new HashMap<>();
            message.put("type", "featured-rooms-update");
            message.put("data", rooms);
            message.put("timestamp", System.currentTimeMillis());

            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));

            LoggerUtil.dev("Sent " + rooms.size() + " featured rooms to user=" + userId);
        } catch (Exception e) {
            LoggerUtil.error(WebSocketHandler.class,
                    "Error sending featured rooms=" + e.getMessage(), e);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        Map<String, String> metadata = sessionMetadata.remove(session);
        if (metadata == null) {
            return;
        }

        String metadataType = metadata.get("type");

        if ("featured".equals(metadataType)) {
            String userId = metadata.get("userId");
            socketIdToSession.remove(session.getId());

            Set<String> userSockets = userFeaturedRoomsSubscriptions.get(userId);
            if (userSockets != null) {
                userSockets.remove(session.getId());
                if (userSockets.isEmpty()) {
                    userFeaturedRoomsSubscriptions.remove(userId);
                }
            }
            socketToUserId.remove(session.getId());
            LoggerUtil.audit("Featured rooms WebSocket disconnected for userId=" + userId);
            return;
        }

        if ("room".equals(metadataType)) {
            String roomCode = metadata.get("roomCode");
            socketIdToSession.remove(session.getId());

            Set<String> subscribers = roomSubscriptions.get(roomCode);
            if (subscribers != null) {
                subscribers.remove(session.getId());
                if (subscribers.isEmpty()) {
                    roomSubscriptions.remove(roomCode);
                }
            }
            socketToRoom.remove(session.getId());
            LoggerUtil.audit("WebSocket disconnected for room, roomCode=" + roomCode);
            return;
        }

        String sessionId = metadata.get("sessionId");
        String role = metadata.get("role");

        socketIdToSession.remove(session.getId());

        Session dbSession = sessionService.getSession(sessionId);

        if ("receiver".equalsIgnoreCase(role) && dbSession != null &&
                dbSession.isMultiRecipient()) {
            sessionService.removeReceiver(sessionId, session.getId());
            notifyReceiverDisconnected(sessionId, session.getId());
        } else {
            sessionService.updateSessionStatus(sessionId, SessionStatus.EXPIRED);
            notifyPeerDisconnected(sessionId);
        }

        LoggerUtil.audit("WebSocket disconnected for sessionId=" + sessionId + ",role=" + role);
    }

    private void handleOffer(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);

        if (session == null) {
            sendError(sender, "session not found");
            return;
        }

        if (session.isMultiRecipient()) {
            String targetReceiverId = message.getTo();

            if (targetReceiverId != null) {
                WebSocketSession receiverSession = socketIdToSession.get(targetReceiverId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    message.setFrom(sender.getId());
                    message.setTo(receiverSession.getId());
                    synchronized (lock) {
                        receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                    }
                    LoggerUtil.audit("offer sent to specific receiver " + targetReceiverId + " for sessionId=" + sessionId);
                } else {
                    LoggerUtil.warn(WebSocketHandler.class, "target receiver not found=" + targetReceiverId);
                }
            } else {
                Set<String> receiverSocketIds = session.getReceiverSocketIds();
                if (receiverSocketIds == null || receiverSocketIds.isEmpty()) {
                    sendError(sender, "no receivers connected");
                    return;
                }

                int sentCount = 0;
                for (String receiverSocketId : receiverSocketIds) {
                    WebSocketSession receiverSession = socketIdToSession.get(receiverSocketId);

                    if (receiverSession != null && receiverSession.isOpen()) {
                        message.setFrom(sender.getId());
                        message.setTo(receiverSession.getId());
                        synchronized (lock) {
                            receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                        }
                        sentCount++;
                        LoggerUtil.audit("offer sent to receiver " + receiverSocketId + " for sessionId=" + sessionId);
                    } else {
                        LoggerUtil.warn(WebSocketHandler.class, "receiver session not found or closed for receiverId=" + receiverSocketId);
                    }
                }
                LoggerUtil.audit("offer broadcast to " + sentCount + " out of " + receiverSocketIds.size() + " receivers for sessionId=" + sessionId);
            }
        } else {
            String receiverSocketId = session.getReceiverSocketId();
            if (receiverSocketId == null) {
                sendError(sender, "receiver not connected");
                return;
            }

            WebSocketSession receiverSession = socketIdToSession.get(receiverSocketId);

            if (receiverSession != null && receiverSession.isOpen()) {
                message.setFrom(sender.getId());
                message.setTo(receiverSession.getId());
                synchronized (lock) {
                    receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
                LoggerUtil.audit("offer routed to receiver for sessionId=" + sessionId);
            } else {
                LoggerUtil.error(WebSocketHandler.class, "receiver session not found or closed for sessionId=" + sessionId + ",receiverSocketId=" + receiverSocketId,null);
                sendError(sender, "receiver session not found or closed");
            }
        }
    }
    private void handleAnswer(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);

        if (session == null || session.getSenderSocketId() == null) {
            sendError(sender, "sender not connected");
            return;
        }

        WebSocketSession senderSession = socketIdToSession.get(session.getSenderSocketId());
        if (senderSession != null && senderSession.isOpen()) {
            message.setFrom(sender.getId());
            message.setTo(senderSession.getId());
            synchronized (lock) {
                senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
            LoggerUtil.audit("answer routed to sender for sessionId=" + sessionId);
        } else {
            sendError(sender, "sender session not found or closed");
        }
    }

    private void handleIceCandidate(String sessionId, WebSocketSession sender, SignalingMessage message, String role) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);

        if (session == null) {
            return;
        }

        String targetSocketId = message.getTo();

        if (targetSocketId == null) {
            if ("sender".equalsIgnoreCase(role)) {
                targetSocketId = session.getReceiverSocketId();
            } else {
                targetSocketId = session.getSenderSocketId();
            }
        }

        if (targetSocketId != null) {
            WebSocketSession targetSession = socketIdToSession.get(targetSocketId);
            if (targetSession != null && targetSession.isOpen()) {
                message.setFrom(sender.getId());
                message.setTo(targetSession.getId());
                synchronized (lock) {
                    targetSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
                LoggerUtil.dev("ice candidate routed for sessionId=" + sessionId +
                        (session.isMultiRecipient() ? ",to=" + targetSocketId : ""));
            }
        }
    }

    private void handlePeerReady(String sessionId, WebSocketSession sender, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);
        if (session == null || session.getSenderSocketId() == null) {
            sendError(sender, "sender not connected");
            return;
        }

        WebSocketSession senderSession = socketIdToSession.get(session.getSenderSocketId());
        if (senderSession != null && senderSession.isOpen()) {
            message.setFrom(sender.getId());
            message.setTo(senderSession.getId());

            if (session.isMultiRecipient()) {
                if (message.getData() == null) {
                    message.setData(new HashMap<>());
                }
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) message.getData();
                data.put("receiverId", sender.getId());
                message.setData(data);
            }

            synchronized (lock) {
                senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
            LoggerUtil.audit("peer-ready signal routed to sender for sessionId=" + sessionId +
                    (session.isMultiRecipient() ? ",receiverId=" + sender.getId() : ""));
        }
    }

    private void handleTransferStart(String sessionId, SignalingMessage message) throws IOException {
        sessionService.updateSessionStatus(sessionId, SessionStatus.TRANSFERRING);
        broadcastToSession(sessionId, message);
        LoggerUtil.audit("file transfer started for sessionId=" + sessionId);
    }

    private void handleTransferComplete(String sessionId, SignalingMessage message) throws IOException {
        sessionService.updateSessionStatus(sessionId, SessionStatus.CONNECTED);
        broadcastToSession(sessionId, message);
        LoggerUtil.audit("file transfer completed for sessionId=" + sessionId);
    }

    private void handleBroadcastStatus(String sessionId, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);
        if (session == null) {
            return;
        }

        Map<String, Object> statusData = new HashMap<>();
        statusData.put("totalReceivers", session.getReceiverSocketIds() != null ? session.getReceiverSocketIds().size() : 0);
        statusData.put("receiverProgress", session.getReceiverProgress());

        message.setData(statusData);

        String senderSocketId = session.getSenderSocketId();
        if (senderSocketId != null) {
            WebSocketSession senderSession = socketIdToSession.get(senderSocketId);
            if (senderSession != null && senderSession.isOpen()) {
                synchronized (lock) {
                    senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                }
            }
        }
    }

    private void broadcastToSession(String sessionId, SignalingMessage message) throws IOException {
        Session session = sessionService.getSession(sessionId);
        Object lock = getSessionLock(sessionId);
        if (session == null) {
            return;
        }

        String senderSocketId = session.getSenderSocketId();
        if (senderSocketId != null) {
            WebSocketSession senderSession = socketIdToSession.get(senderSocketId);
            if (senderSession != null && senderSession.isOpen()) {
                senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
            }
        }

        if (session.isMultiRecipient()) {
            Set<String> receiverSocketIds = session.getReceiverSocketIds();
            if (receiverSocketIds != null) {
                for (String receiverSocketId : receiverSocketIds) {
                    WebSocketSession receiverSession = socketIdToSession.get(receiverSocketId);
                    if (receiverSession != null && receiverSession.isOpen()) {
                        synchronized (lock) {
                            receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                        }
                    }
                }
            }
        } else {
            String receiverSocketId = session.getReceiverSocketId();
            if (receiverSocketId != null) {
                WebSocketSession receiverSession = socketIdToSession.get(receiverSocketId);
                if (receiverSession != null && receiverSession.isOpen()) {
                    synchronized (lock) {
                        receiverSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(message)));
                    }
                }
            }
        }
    }

    private void notifyPeerDisconnected(String sessionId) {
        Session session = sessionService.getSession(sessionId);
        if (session == null) {
            return;
        }

        SignalingMessage disconnectMsg = SignalingMessage.builder()
                .type("peer-disconnected")
                .sessionId(sessionId)
                .message("the other peer has disconnected")
                .timestamp(System.currentTimeMillis())
                .build();

        try {
            broadcastToSession(sessionId, disconnectMsg);
        } catch (IOException e) {
            LoggerUtil.error(WebSocketHandler.class, "Failed to send disconnect notification=" + e.getMessage(), e);
        }
    }

    private void notifyReceiverDisconnected(String sessionId, String receiverSocketId) {
        Session session = sessionService.getSession(sessionId);
        if (session == null) {
            return;
        }

        WebSocketSession senderSession = socketIdToSession.get(session.getSenderSocketId());

        if (senderSession != null && senderSession.isOpen()) {
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
                        "Failed to send receiver disconnect=" + e.getMessage(), e);
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
            LoggerUtil.error(WebSocketHandler.class, "Failed to send error=" + e.getMessage(), e);
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

    public void broadcastRoomUpdate(String roomCode, Object updateData) {
        Set<String> subscribers = roomSubscriptions.get(roomCode);
        if(subscribers == null || subscribers.isEmpty()){
            return;
        }

        Map<String, Object> message = new HashMap<>();
        message.put("type", "room-update");
        message.put("roomCode", roomCode);
        message.put("data", updateData);
        message.put("timestamp", System.currentTimeMillis());

        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(jsonMessage);

            for(String socketId: subscribers){
                WebSocketSession wsSession = socketIdToSession.get(socketId);
                if(wsSession != null && wsSession.isOpen()) {
                    try{
                        synchronized (wsSession){
                            wsSession.sendMessage(textMessage);
                        }
                    }catch (IOException e){
                        LoggerUtil.error(WebSocketHandler.class,"Failed to send room update to socket=" + socketId,e);
                    }
                }
            }
            LoggerUtil.dev("Room update broadcast to=" + subscribers.size() + ",subscribers for room=" + roomCode);
        }catch (Exception e){
            LoggerUtil.error(WebSocketHandler.class, "Failed to broadcast room update=" + e.getMessage(), e);
        }
    }
}