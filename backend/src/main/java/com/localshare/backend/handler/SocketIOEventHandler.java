package com.localshare.backend.handler;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.localshare.backend.dto.SignalingMessage;
import com.localshare.backend.model.Session;
import com.localshare.backend.model.SessionStatus;
import com.localshare.backend.service.SessionService;
import com.localshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * handles socketIO events for WebRTC signaling
 */
@Component
@RequiredArgsConstructor
public class SocketIOEventHandler {

    private final SocketIOServer socketIOServer;
    private final SessionService sessionService;

    private SocketIOClient getClientBySocketId(String socketId) {
        if (socketId == null) {
            return null;
        }
        try {
            UUID uuid = UUID.fromString(socketId);
            return socketIOServer.getClient(uuid);
        } catch (IllegalArgumentException e) {
            LoggerUtil.dev("Socket ID is not a UUID, searching clients: " + socketId);
            for (SocketIOClient client : socketIOServer.getAllClients()) {
                if (socketId.equals(client.getSessionId().toString())) {
                    return client;
                }
            }
            LoggerUtil.warn(SocketIOEventHandler.class, "Client not found for socketId: " + socketId);
            return null;
        }
    }

    /**
     * called when client connects to socketIO server
     */
    @OnConnect
    public void onConnect(SocketIOClient client) {
        String sessionId = client.getHandshakeData().getSingleUrlParam("sessionId");
        String role = client.getHandshakeData().getSingleUrlParam("role");

        if (sessionId != null && role != null) {
            String realSocketId = client.getSessionId().toString();

            if ("sender".equals(role)) {
                sessionService.updateSenderSocketId(sessionId.toUpperCase(), realSocketId);
                LoggerUtil.audit("socketIO connected for socketId=" + realSocketId +
                        ",sessionId=" + sessionId + ",role=sender");
            } else if ("receiver".equals(role)) {
                sessionService.updateReceiverSocketId(sessionId.toUpperCase(), realSocketId);
                LoggerUtil.audit("socketIO connected for socketId=" + realSocketId +
                        ",sessionId=" + sessionId + ",role=receiver");
            }
        }
    }

    /**
     * called when client disconnect
     */
    @OnDisconnect
    public void onDisconnect(SocketIOClient client){
        String sessionId = client.get("sessionId");
        String role = client.get("role");

        LoggerUtil.audit("socketIo client disconnected for socket=" + client.getSessionId() + ",sessionId=" + sessionId + ",role=" + role);

        if(sessionId != null){
            notifyPeerDisconnected(sessionId,client.getSessionId().toString());
            sessionService.updateSessionStatus(sessionId,SessionStatus.EXPIRED);
        }
    }

    /**
     * handle WebRTC OFFER message from sender
     * routes the offer to the receiver
     */
    @OnEvent("offer")
    public void onOffer(SocketIOClient client, SignalingMessage message) {
        String sessionId = message.getSessionId();
        LoggerUtil.audit("offer received for sessionId= " + sessionId + ",from=" + client.getSessionId());

        Session session = sessionService.getSession(sessionId);

        if(session == null){
            LoggerUtil.warn(SocketIOEventHandler.class,"offer rejected, session not found for sessionId=" + sessionId);
            client.sendEvent("error" ,"session not found or expired");
            return;
        }

        if(session.getReceiverSocketId() == null) {
            LoggerUtil.warn(SocketIOEventHandler.class,"offer rejected, receiver not connected for sessionId=" + sessionId);
            client.sendEvent("error","receiver not connected");
            return;
        }

        message.setFrom(client.getSessionId().toString());
        message.setTo(session.getReceiverSocketId());
        message.setTimestamp(System.currentTimeMillis());

        SocketIOClient receiverClient = getClientBySocketId(session.getReceiverSocketId());
        if (receiverClient != null) {
            receiverClient.sendEvent("offer", message);
            LoggerUtil.audit("offer routed to receiver for sessionId=" + sessionId);
        } else {
            LoggerUtil.warn(SocketIOEventHandler.class, "receiver client not found for socketId=" + session.getReceiverSocketId());
            client.sendEvent("error", "receiver not available");
        }
    }

    /**
     * handle WebRTC ANSWER message from receiver
     * routes the answer back to sender
     */
    @OnEvent("answer")
    public void onAnswer(SocketIOClient client, SignalingMessage message) {
        String sessionId = message.getSessionId();
        LoggerUtil.audit("answer received for sessionId=" + sessionId + ",from=" + client.getSessionId());

        Session session = sessionService.getSession(sessionId);

        if(session == null){
            LoggerUtil.warn(SocketIOEventHandler.class,"answer rejected, session not found for sessionId=" + sessionId);
            client.sendEvent("error", "session not found");
            return;
        }

        if(session.getSenderSocketId() == null) {
            LoggerUtil.warn(SocketIOEventHandler.class,"answer rejected, sender not connected for sessionId=" + sessionId);
            client.sendEvent("error","sender not connected");
            return;
        }

        message.setFrom(client.getSessionId().toString());
        message.setTo(session.getSenderSocketId());
        message.setTimestamp(System.currentTimeMillis());

        SocketIOClient senderClient = getClientBySocketId(session.getSenderSocketId());
        if (senderClient != null) {
            senderClient.sendEvent("answer", message);
            LoggerUtil.audit("answer routed to sender for sessionId=" + sessionId);
        } else {
            LoggerUtil.warn(SocketIOEventHandler.class, "sender client not found for socketId=" + session.getSenderSocketId());
            client.sendEvent("error", "sender not available");
        }
    }

    /**
     * handle ICE CANDIDATE message from other peer
     * routes candidate to the other peer
     */
    @OnEvent("ice-candidate")
    public void onIceCandidate(SocketIOClient client, SignalingMessage message) {
        String sessionId = message.getSessionId();
        String role = client.get("role");

        LoggerUtil.audit("ice candidate received for sessionId=" + sessionId + ",from=" + role);

        Session session = sessionService.getSession(sessionId);

        if (session == null) {
            LoggerUtil.warn(SocketIOEventHandler.class,
                    "ice candidate rejected for sessionId=" + sessionId);
            return;
        }

        String targetSocketId;
        if("sender".equalsIgnoreCase(role)){
            targetSocketId = session.getReceiverSocketId();
        } else {
            targetSocketId = session.getSenderSocketId();
        }

        if(targetSocketId == null) {
            LoggerUtil.warn(SocketIOEventHandler.class, "ice candidate rejected, target peer not connected for sessionId= " + sessionId);
            return;
        }

        message.setFrom(client.getSessionId().toString());
        message.setTo(targetSocketId);
        message.setTimestamp(System.currentTimeMillis());

        SocketIOClient targetClient = getClientBySocketId(targetSocketId);
        if (targetClient != null) {
            targetClient.sendEvent("ice-candidate", message);
            LoggerUtil.dev("ice candidate routed for sessionId=" + sessionId);
        } else {
            LoggerUtil.warn(SocketIOEventHandler.class, "target client not found for socketId=" + targetSocketId);
        }
    }

    /**
     * handle file transfer start notification
     * updates session status and notifies receiver
     */
    @OnEvent("transfer-start")
    public void onTransferStart(SocketIOClient client, SignalingMessage message) {
        String sessionId = message.getSessionId();

        LoggerUtil.audit("file transfer started for sessionId=" + sessionId);
        sessionService.updateSessionStatus(sessionId,SessionStatus.TRANSFERRING);

        Session session = sessionService.getSession(sessionId);
        if(session != null && session.getReceiverSocketId() != null) {
            SocketIOClient receiverClient = getClientBySocketId(session.getReceiverSocketId());
            if (receiverClient != null) {
                receiverClient.sendEvent("transfer-start", message);
            }
        }
    }

    /**
     * handle file transfer complete
     * updates session status and clean up
     */
    @OnEvent("transfer-complete")
    public void onTransferComplete(SocketIOClient client, SignalingMessage message){
        String sessionId = message.getSessionId();

        LoggerUtil.audit("file transfer completed for sessionId=" + sessionId);
        sessionService.updateSessionStatus(sessionId,SessionStatus.CONNECTED);

        Session session = sessionService.getSession(sessionId);
        if(session != null){
            if(session.getSenderSocketId() != null){
                SocketIOClient senderClient = getClientBySocketId(session.getSenderSocketId());
                if (senderClient != null) {
                    senderClient.sendEvent("transfer-complete", message);
                }
            }
            if(session.getReceiverSocketId() != null){
                SocketIOClient receiverClient = getClientBySocketId(session.getReceiverSocketId());
                if (receiverClient != null) {
                    receiverClient.sendEvent("transfer-complete", message);
                }
            }
        }
    }

    /**
     * handle peer-ready signal from receiver
     */
    @OnEvent("peer-ready")
    public void onPeerReady(SocketIOClient client, SignalingMessage message){
        String sessionId = message.getSessionId();
        String role = client.get("role");

        LoggerUtil.audit("peer-ready received for sessionId=" + sessionId + ",from=" + role);

        Session session = sessionService.getSession(sessionId);

        if (session == null) {
            LoggerUtil.warn(SocketIOEventHandler.class, "peer-ready rejected, session not found for sessionId=" + sessionId);
            return;
        }

        if (session.getSenderSocketId() == null) {
            LoggerUtil.warn(SocketIOEventHandler.class, "peer-ready rejected, sender not connected for sessionId=" + sessionId);
            return;
        }

        message.setFrom(client.getSessionId().toString());
        message.setTo(session.getSenderSocketId());
        message.setTimestamp(System.currentTimeMillis());

        SocketIOClient senderClient = getClientBySocketId(session.getSenderSocketId());
        if (senderClient != null) {
            senderClient.sendEvent("peer-ready", message);
            LoggerUtil.audit("peer-ready signal routed to sender for sessionId=" + sessionId);
        } else {
            LoggerUtil.warn(SocketIOEventHandler.class, "sender client not found for socketId=" + session.getSenderSocketId());
        }
    }

    /**
     * notify a peer that other peer disconnected
     */
    private void notifyPeerDisconnected(String sessionId, String disconnectedSocketId){
        Session session = sessionService.getSession(sessionId);

        if(session == null){
            return;
        }

        String otherPeerSocketId = null;
        if(disconnectedSocketId.equals(session.getSenderSocketId())){
            otherPeerSocketId = session.getReceiverSocketId();
        } else if(disconnectedSocketId.equals(session.getReceiverSocketId())){
            otherPeerSocketId = session.getSenderSocketId();
        }

        if(otherPeerSocketId != null) {
            try {
                SignalingMessage disconnectMessage = SignalingMessage.builder()
                        .type("peer-disconnected")
                        .sessionId(sessionId)
                        .message("the other peer has disconnected")
                        .timestamp(System.currentTimeMillis())
                        .build();

                SocketIOClient otherClient = getClientBySocketId(otherPeerSocketId);
                if (otherClient != null) {
                    otherClient.sendEvent("peer-disconnected", disconnectMessage);
                    LoggerUtil.audit("peer disconnection notified for sessionId=" + sessionId);
                } else {
                    LoggerUtil.warn(SocketIOEventHandler.class, "other peer client not found for socketId=" + otherPeerSocketId);
                }
            }catch (Exception e){
                LoggerUtil.error(SocketIOEventHandler.class,"failed to notify peer disconnection for sessionId=" + sessionId, e);
            }
        }
    }
}
