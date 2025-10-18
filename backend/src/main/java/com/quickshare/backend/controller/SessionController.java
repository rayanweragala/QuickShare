package com.quickshare.backend.controller;

import com.quickshare.backend.dto.SessionResponse;
import com.quickshare.backend.model.Session;
import com.quickshare.backend.model.enums.SessionStatus;
import com.quickshare.backend.service.SessionService;
import com.quickshare.backend.util.LoggerUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * REST API controller for session management
 */

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * create a new file sharing session and returns the session ID
     */
    @PostMapping("/create")
    public ResponseEntity<SessionResponse> createSession(HttpServletRequest request){
        String clientIp = getClientIP(request);
        LoggerUtil.audit("session create request for ip=" + clientIp);

        String tempSocketId = "temp-" + System.currentTimeMillis();

        Session session = sessionService.createSession(tempSocketId,clientIp);
        SessionResponse response = SessionResponse.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus())
                .message("session created successfully. share the code with receiver")
                .bothConnected(false)
                .createdAt(session.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .qrCodeData(generateQrCodeUrl(session.getSessionId()))
                .isMultiRecipient(false)
                .build();

        LoggerUtil.audit("session created successfully, sessionId=" + session.getSessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * create a new broadcast session
     */
    @PostMapping("/create-broadcast")
    public ResponseEntity<SessionResponse> createBroadCastSession(HttpServletRequest request) {
        String clientIp = getClientIP(request);
        LoggerUtil.audit("broadcast session create request for ip=" + clientIp);

        String tempSocketId = "temp-" + System.currentTimeMillis();

        Session session = sessionService.createBroadcastSession(tempSocketId, clientIp);

        SessionResponse response = SessionResponse.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus())
                .message("broadcast session created successfully. share the code with receivers")
                .bothConnected(false)
                .createdAt(session.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .qrCodeData(generateQrCodeUrl(session.getSessionId()))
                .isMultiRecipient(true)
                .build();

        LoggerUtil.audit("broadcast session created successfully, sessionId=" + session.getSessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * receiver joins an existing session using the session id
     */
    @PostMapping("/join/{sessionId}")
    public ResponseEntity<SessionResponse> joinSession(@PathVariable String sessionId, HttpServletRequest request){
        String clientIp = getClientIP(request);
        LoggerUtil.dev("join session request for sessionId=" + sessionId + ",and ip=" + clientIp);

        if(sessionId == null || sessionId.trim().isEmpty()){
            throw new IllegalArgumentException("session id cannot be empty");
        }

        Session session = sessionService.getSession(sessionId.toUpperCase());

        if(session == null) {
            LoggerUtil.warn(SessionController.class, "session not found for sessionId=" + sessionId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(SessionResponse.error("session not found"));
        }

        if(session.isMultiRecipient()){
            sessionService.addReceiver(sessionId.toUpperCase(),null,clientIp);
            LoggerUtil.audit("receiver added to broadcast session for sessionId=" + sessionId);
        } else {
            String tempSocketId = "temp-" + System.currentTimeMillis();
            sessionService.joinSession(sessionId.toUpperCase(), tempSocketId, clientIp);
        }
        SessionResponse response = SessionResponse.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus())
                .message("successfully joined the session. peer connection creating...")
                .bothConnected(session.isBothConnected())
                .build();

        LoggerUtil.audit("session join successful for sessionId=" + sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * allows adding receivers to exist broadcast session
     */
    @PostMapping("{sessionId}/add-receiver")
    private ResponseEntity<SessionResponse> addReceiverToSession(@PathVariable String  sessionId, HttpServletRequest request) {
        String clientIp = getClientIP(request);
        LoggerUtil.dev("add receiver for sessionId=" + sessionId);

        if(sessionId == null || sessionId.trim().isEmpty()){
            throw new IllegalArgumentException("session id cannot be empty");
        }

        String tempSocketId = "temp-" + System.currentTimeMillis();
        Session session = sessionService.addReceiver(sessionId, tempSocketId, clientIp);

        SessionResponse response = SessionResponse.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus())
                .message("successfully added to the session. peer connection creating...")
                .bothConnected(session.isBothConnected())
                .build();

        LoggerUtil.audit("session adding successful for sessionId=" + sessionId);
        return ResponseEntity.ok(response);
    }

    /**
     * retrieve current session information
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> getSession(@PathVariable String  sessionId){
        LoggerUtil.dev("get session for sessionId=" + sessionId);

        Session session = sessionService.getSession(sessionId.toUpperCase());

        if(session == null){
            LoggerUtil.warn(SessionController.class,"session not found for sessionId=" + sessionId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(SessionResponse.error("session not found"));
        }

        SessionResponse response = SessionResponse.builder()
                .sessionId(session.getSessionId())
                .status(session.getStatus())
                .bothConnected(session.isBothConnected())
                .createdAt(session.getCreatedAt().format(DateTimeFormatter.ISO_DATE_TIME))
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * retrieve list of all connected receivers
     */
    @GetMapping("/{sessionId}/receivers")
    private ResponseEntity<Map<String, Object>> getActiveReceivers(@PathVariable String sessionId, HttpServletRequest request){
        Session session = sessionService.getSession(sessionId);

        if(session == null || !session.isMultiRecipient()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "session not found or not broadcast"));
        }
        Set<String> receiverIds = session.getReceiverSocketIds();
        if(receiverIds == null){
            receiverIds = Set.of();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getSessionId());
        response.put("totalReceivers", receiverIds.size());
        response.put("receiverIds", receiverIds);
        Map<String, Integer> progress = session.getReceiverProgress();
        response.put("receiverProgress", progress != null ? progress : Map.of());

        return ResponseEntity.ok(response);
    }

    /**
     * manually end a session and resources cleanup
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<SessionResponse> deleteSession(@PathVariable String sessionId){
        LoggerUtil.audit("delete session for sessionId=" + sessionId);
        boolean isDeleted = sessionService.deleteSession(sessionId.toUpperCase());

        if(isDeleted){
            SessionResponse response = SessionResponse.builder()
                    .sessionId(sessionId)
                    .status(SessionStatus.EXPIRED)
                    .message("session deleted successfully")
                    .build();
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(SessionResponse.error("session not found"));
        }
    }


    /**
     * update the status of a session (e.g., CONNECTED --> TRANSFERRING)
     */
    @PutMapping("/{sessionId}/status")
    public ResponseEntity<SessionResponse> updateStatus(@PathVariable String sessionId, @RequestParam SessionStatus sessionStatus){
        LoggerUtil.audit("update session status for sessionId=" + sessionId + ",newStatus=" + sessionStatus);

        sessionService.updateSessionStatus(sessionId.toUpperCase(),sessionStatus);

        SessionResponse response = SessionResponse.builder()
                .sessionId(sessionId)
                .status(sessionStatus)
                .message("session status updated successfully")
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * get client IP address from the request
     * handles proxy headers (X-Forwarded-For)
     */
    private String getClientIP(HttpServletRequest request){
        String ip = request.getHeader("X-Forwarded-For");

        if(ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)){
            ip = request.getHeader("X-Real-IP");
        }

        if(ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)){
            ip = request.getRemoteAddr();
        }

        if(ip != null && ip.contains(",")){
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * generate QR code url to display on frontend
     */
    private String generateQrCodeUrl(String sessionId){

        return sessionId;
    }
}
