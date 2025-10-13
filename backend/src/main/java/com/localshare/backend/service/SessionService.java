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
import java.util.*;

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
    public Session joinSession(String sessionId, String tempSocketId, String clientIp) {
        LoggerUtil.dev("join session for sessionId=" + sessionId);

        Session session = getSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found");
        }

        if (session.isMultiRecipient()) {
            return addReceiver(sessionId, tempSocketId, clientIp);
        }

        session.setReceiverSocketId(tempSocketId);
        session.setStatus(SessionStatus.CONNECTED);

        sessionRepository.save(sessionId, session);
        LoggerUtil.audit("session joined for sessionId=" + sessionId +
                ",receiverIp=" + clientIp);

        return session;
    }

    /**
     * update receiver socket ID in broadcast mode
     * this replaces pending placeholders with actual socket IDs
     */
    public void updateReceiverSocketIdInBroadcast(String sessionId, String oldSocketId, String newSocketId) {
        Session session = getSession(sessionId);
        if (session == null || !session.isMultiRecipient()) {
            return;
        }

        Set<String> receivers = session.getReceiverSocketIds();
        if (receivers == null) {
            receivers = new HashSet<>();
            session.setReceiverSocketIds(receivers);
        }

        Map<String, String> ips = session.getReceiverIps();
        if (ips == null) {
            ips = new HashMap<>();
            session.setReceiverIps(ips);
        }

        Map<String, Integer> progress = session.getReceiverProgress();
        if (progress == null) {
            progress = new HashMap<>();
            session.setReceiverProgress(progress);
        }

        if (oldSocketId != null && (oldSocketId.startsWith("temp-") || oldSocketId.startsWith("pending-"))) {
            receivers.remove(oldSocketId);

            String oldIp = ips.remove(oldSocketId);
            if (oldIp != null) {
                ips.put(newSocketId, oldIp);
            }

            Integer oldProgress = progress.remove(oldSocketId);
            if (oldProgress != null) {
                progress.put(newSocketId, oldProgress);
            } else {
                progress.put(newSocketId, 0);
            }
        } else {
            receivers.add(newSocketId);
            if (!ips.containsKey(newSocketId)) {
                ips.put(newSocketId, null);
            }
            if (!progress.containsKey(newSocketId)) {
                progress.put(newSocketId, 0);
            }
        }

        sessionRepository.save(sessionId, session);

        LoggerUtil.audit("receiver socket updated in broadcast set for sessionId=" + sessionId +
                ",oldSocketId=" + oldSocketId + ",newSocketId=" + newSocketId);
    }
    /**
     * allow additional receivers to join an active session
     * returns the updated session with all receivers
     */
    public Session addReceiver(String sessionId, String tempSocketId, String clientIp) {
        LoggerUtil.dev("add receiver for sessionId=" + sessionId);

        Session session = getSession(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found");
        }

        if (!session.isMultiRecipient()) {
            throw new IllegalArgumentException("Session is not in broadcast mode");
        }

        if (session.getReceiverSocketIds() == null) {
            session.setReceiverSocketIds(new HashSet<>());
        }
        if (session.getReceiverIps() == null) {
            session.setReceiverIps(new HashMap<>());
        }
        if (session.getReceiverProgress() == null) {
            session.setReceiverProgress(new HashMap<>());
        }

        String placeholder = "pending-" + UUID.randomUUID().toString().substring(0, 8);

        session.getReceiverSocketIds().add(placeholder);

        if (clientIp != null && !clientIp.isEmpty()) {
            session.getReceiverIps().put(placeholder, clientIp);
        }

        session.getReceiverProgress().put(placeholder, 0);

        sessionRepository.save(sessionId, session);

        LoggerUtil.audit("receiver added to broadcast set for sessionId=" + sessionId +
                ",placeholder=" + placeholder + ",ip=" + clientIp);

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
     * update receiver socket ID when actual WebSocket connection is established
     */
    public void updateReceiverSocketId(String sessionId, String realSocketId) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            String oldSocketId = session.getReceiverSocketId();
            session.setReceiverSocketId(realSocketId);

            if (session.isMultiRecipient() && session.getReceiverSocketIds() != null) {
                session.getReceiverSocketIds().remove(oldSocketId);
                session.getReceiverSocketIds().add(realSocketId);
                LoggerUtil.audit("receiver socket updated in broadcast set for sessionId=" + sessionId +
                        ",oldSocketId=" + oldSocketId + ",newSocketId=" + realSocketId);
            }

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