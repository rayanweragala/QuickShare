package com.localshare.backend.service;

import com.localshare.backend.dto.SessionResponse;
import com.localshare.backend.model.Session;
import com.localshare.backend.model.SessionStatus;
import com.localshare.backend.repository.SessionRepository;
import com.localshare.backend.util.LoggerUtil;
import com.localshare.backend.component.StringUtilities;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;

/**
 * service for session management
 * handles core business logic for creating, joining, and managing file sharing sessions
 */
@Service
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final StringUtilities stringUtilities;

    @Value("${session.timeout-minutes}")
    private int sessionTimeoutMinutes;

    /**
     * create a new file sharing session
     */
    public Session createSession(String senderSocketId, String senderIp) {
        String sessionId = stringUtilities.generateUniqueSessionId();

        Session session = Session.builder()
                .sessionId(sessionId)
                .senderSocketId(senderSocketId)
                .status(SessionStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .senderIp(senderIp)
                .totalFiles(0)
                .completedFiles(0)
                .build();

        sessionRepository.save(session, sessionTimeoutMinutes);
        LoggerUtil.audit("session created. SessionId=" + sessionId + ",senderIp=" + senderIp);
        return session;
    }

    /**
     * create a new broadcasting session
     */
    public Session createBroadcastSession(String senderSocketId,String senderIp){
        String sessionId = stringUtilities.generateUniqueSessionId();

        Session session = Session.builder()
                .sessionId(sessionId)
                .senderSocketId(senderSocketId)
                .status(SessionStatus.WAITING)
                .createdAt(LocalDateTime.now())
                .lastActivityAt(LocalDateTime.now())
                .senderIp(senderIp)
                .totalFiles(0)
                .completedFiles(0)
                .isMultiRecipient(true)
                .build();

        sessionRepository.save(session, sessionTimeoutMinutes);
        LoggerUtil.audit("broadcast session created. SessionId=" + sessionId + ", senderIp=" + senderIp);
        return session;
    }

    /**
     * join an existing session as a receiver
     */
    public Session joinSession(String sessionId, String receiverSocketId, String receiverIp) {
        Session session = sessionRepository.findById(sessionId);
        if (session == null) {
            LoggerUtil.warn(SessionService.class, "join attempt failed, session not found for sessionId=" + sessionId);
            throw new IllegalStateException("session not found or expired");
        }

        if(session.isMultiRecipient()){
            if(session.getReceiverSocketIds() == null){
                session.setReceiverSocketIds(new HashSet<>());
            }
            if(session.getReceiverSocketIds().size() >= session.getMaxReceivers()){
                LoggerUtil.warn(SessionService.class,"join attempt failed, max receivers reached for sessionId=" + sessionId);
                throw new IllegalStateException("max receivers reached");
            }

            session.getReceiverSocketIds().add(receiverSocketId);
            if(session.getReceiverIps() == null){
                session.setReceiverIps(new HashMap<>());
            }
            session.getReceiverIps().put(receiverSocketId,receiverIp);
        } else {
            if (session.getReceiverSocketId() != null && !session.getReceiverSocketId().startsWith("temp-")) {
                LoggerUtil.warn(SessionService.class, "join attempt failed, session already has a receiver for sessionId=" + sessionId);
                throw new IllegalStateException("session already have a receiver");
            }

            session.setReceiverSocketId(receiverSocketId);
            session.setReceiverIp(receiverIp);
        }

        session.setStatus(SessionStatus.CONNECTED);
        session.updateActivity();

        sessionRepository.save(session, sessionTimeoutMinutes);
        LoggerUtil.audit("session joined for sessionId=" + sessionId + ",receiverIp=" + receiverIp);
        return session;
    }

    /**
     * allow additional receivers to join an active session
     * returns the updated session with all receivers
     */
    public Session addReceiver(String sessionId, String receiverSocketId, String receiverIp){
        Session session = sessionRepository.findById(sessionId);
        if(session == null) {
            throw new IllegalStateException("session not found or expired");
        }
        if(!session.isMultiRecipient()){
            throw new IllegalStateException("session does not support multiple receivers");
        }

        if(session.getReceiverSocketIds() == null) {
            session.setReceiverSocketIds(new HashSet<>());
        }

        if(session.getReceiverSocketIds().size() >= session.getMaxReceivers()){
            throw new IllegalStateException("max receivers reached");
        }

        session.getReceiverSocketIds().add(receiverSocketId);

        if(session.getReceiverIps() == null){
            session.setReceiverIps(new HashMap<>());
        }

        session.getReceiverIps().put(receiverSocketId,receiverIp);

        if(session.getReceiverProgress() == null){
            session.setReceiverProgress(new HashMap<>());
        }
        session.getReceiverProgress().put(receiverSocketId,0);

        session.updateActivity();
        sessionRepository.save(session,sessionTimeoutMinutes);

        LoggerUtil.audit("receiver added for sessionId=" + sessionId + ",receiverSocketId=" + receiverSocketId);
        return session;
    }

    /**
     * Update sender socket ID when actual WebSocket connection is established
     */
    public void updateSenderSocketId(String sessionId, String realSocketId) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            String oldSocketId = session.getSenderSocketId();
            session.setSenderSocketId(realSocketId);
            session.updateActivity();
            sessionRepository.update(session, sessionTimeoutMinutes);

            LoggerUtil.audit("sender socket updated for sessionId=" + sessionId +
                    ",oldSocketId=" + oldSocketId + ",newSocketId=" + realSocketId);
        } else {
            LoggerUtil.warn(SessionService.class, "failed to update sender socket, session not found for sessionId=" + sessionId);
        }
    }

    /**
     * Update receiver socket ID when actual WebSocket connection is established
     */
    public void updateReceiverSocketId(String sessionId, String realSocketId) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            String oldSocketId = session.getReceiverSocketId();
            session.setReceiverSocketId(realSocketId);
            session.updateActivity();
            sessionRepository.update(session, sessionTimeoutMinutes);

            LoggerUtil.audit("receiver socket updated for sessionId=" + sessionId +
                    ",oldSocketId=" + oldSocketId + ",newSocketId=" + realSocketId);
        } else {
            LoggerUtil.warn(SessionService.class, "failed to update receiver socket, session not found for sessionId=" + sessionId);
        }
    }

    /**
     * update session status (e.g., from CONNECTED to TRANSFERRING)
     */
    public void updateSessionStatus(String sessionId, SessionStatus newStatus) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            SessionStatus oldStatus = session.getStatus();
            session.setStatus(newStatus);
            session.updateActivity();
            sessionRepository.update(session, sessionTimeoutMinutes);

            LoggerUtil.audit("session status updated for sessionId=" + sessionId + ",oldStatus=" + oldStatus + ",newStatus=" + newStatus);
        } else {
            LoggerUtil.warn(SessionService.class, "session update failed for sessionId=" + sessionId + ",session not found");
        }
    }

    /**
     * update file transfer progress
     */
    public void updateProgress(String sessionId, String receiverSocketId, int totalFiles, int completedFiles) {
        Session session = sessionRepository.findById(sessionId);

        if(session == null){
            LoggerUtil.warn(SessionService.class,"update progress failed for sessionId=" + sessionId);
            return;
        }

        session.setTotalFiles(totalFiles);

        if(session.isMultiRecipient()){
            if(session.getReceiverProgress() == null){
                session.setReceiverProgress(new HashMap<>());
            }
            session.getReceiverProgress().put(receiverSocketId,completedFiles);
            boolean allComplete = session.getReceiverSocketIds() != null &&
                    !session.getReceiverSocketIds().isEmpty() &&
                    session.getReceiverSocketIds().stream()
                            .allMatch(id -> session.getReceiverProgress().getOrDefault(id,0) >= totalFiles);

            if(allComplete && totalFiles > 0) {
                session.setStatus(SessionStatus.COMPLETED);
            }
        } else {
            session.setCompletedFiles(completedFiles);
            if (completedFiles >= totalFiles && totalFiles > 0) {
                session.setStatus(SessionStatus.COMPLETED);
            }
        }

        session.updateActivity();
        sessionRepository.update(session,sessionTimeoutMinutes);
        LoggerUtil.audit("progress updated for sessionId=" + sessionId + ",receiver=" + receiverSocketId + ",completed=" + completedFiles + "/" + totalFiles);
    }


    /**
     * remove a specific receiver from session
     */
    public void removeReceiver(String sessionId, String receiverSocketId){
        Session session = sessionRepository.findById(sessionId);

        if(session == null){
            throw new IllegalStateException("session not found or expired");
        }

        if(session.isMultiRecipient()){
            if(session.getReceiverSocketIds() != null){
                session.getReceiverSocketIds().remove(receiverSocketId);
            }
            if(session.getReceiverIps() != null){
                session.getReceiverIps().remove(receiverSocketId);
            }
            if(session.getReceiverProgress() != null){
                session.getReceiverProgress().remove(receiverSocketId);
            }
            if(session.getReceiverSocketIds() == null || session.getReceiverSocketIds().isEmpty()){
                session.setStatus(SessionStatus.WAITING);
            }
        } else {
            if(receiverSocketId.equals(session.getReceiverSocketId())){
                session.setReceiverSocketId(null);
                session.setReceiverIp(null);
                session.setStatus(SessionStatus.WAITING);
            }
        }

        session.updateActivity();
        sessionRepository.update(session,sessionTimeoutMinutes);
        LoggerUtil.audit("receiver received for sessionId=" + sessionId + ",receiver=" + receiverSocketId);
    }

    /**
     * get session by id
     */
    public Session getSession(String sessionId) {
        return sessionRepository.findById(sessionId);
    }

    /**
     * Refresh session activity (extends TTL).
     */
    public void refreshActivity(String sessionId) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            session.updateActivity();
            sessionRepository.update(session, sessionTimeoutMinutes);
            LoggerUtil.dev("session activity refreshed for sessionId=" + sessionId);
        }
    }

    /**
     * delete a session manually
     */
    public boolean deleteSession(String sessionId){
        boolean deleted = sessionRepository.delete(sessionId);

        if(deleted){
            LoggerUtil.audit("session deleted for sessionId=" + sessionId);
        }
        return deleted;
    }
}