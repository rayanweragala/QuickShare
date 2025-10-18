package com.localshare.backend.service;

import com.localshare.backend.model.Session;
import com.localshare.backend.model.SessionStatus;
import com.localshare.backend.repository.SessionRepository;
import com.localshare.backend.util.LoggerUtil;
import com.localshare.backend.component.StringUtilities;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

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
     * create a nre file sharing session
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
     * join an existing session as a receiver
     */
    public Session joinSession(String sessionId, String receiverSocketId, String receiverIp) {
        Session session = sessionRepository.findById(sessionId);
        if (session == null) {
            LoggerUtil.warn(SessionService.class, "join attempt failed, session not found for sessionId=" + sessionId);
            throw new IllegalStateException("session not found or expired");
        }

        if (session.getReceiverSocketId() != null) {
            LoggerUtil.warn(SessionService.class, "join attempt failed, session already has a receiver for sessionId=" + sessionId);
            throw new IllegalStateException("session already have a receiver");
        }

        session.setReceiverSocketId(receiverSocketId);
        session.setReceiverIp(receiverIp);
        session.setStatus(SessionStatus.CONNECTED);
        session.updateActivity();

        sessionRepository.save(session, sessionTimeoutMinutes);
        LoggerUtil.audit("session joined for sesisonId=" + sessionId + ",receiverIp=" + receiverIp);
        return session;
    }

    /**
     * update session status (e.g., from CONNECTED to TRANSFERRING"
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
    public void updateProgress(String sessionId, int totalFiles, int completedFiles) {
        Session session = sessionRepository.findById(sessionId);

        if (session != null) {
            session.setTotalFiles(totalFiles);
            session.setCompletedFiles(completedFiles);
            session.updateActivity();

            if (completedFiles >= totalFiles && totalFiles > 0) {
                session.setStatus(SessionStatus.COMPLETED);
            }
            sessionRepository.update(session, sessionTimeoutMinutes);

            LoggerUtil.audit("progress updated for sessionId=" + sessionId + ",completed=" + completedFiles + "/" + completedFiles);
        }
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
            LoggerUtil.audit("session deleted for sessioNId=" + sessionId);
        }
        return deleted;
    }
}
