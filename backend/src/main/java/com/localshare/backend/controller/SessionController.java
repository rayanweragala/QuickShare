package com.localshare.backend.controller;

import com.localshare.backend.dto.SessionResponse;
import com.localshare.backend.model.Session;
import com.localshare.backend.model.SessionStatus;
import com.localshare.backend.service.SessionService;
import com.localshare.backend.util.LoggerUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;

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
                .build();

        LoggerUtil.audit("session created successfully, sessionId=" + session.getSessionId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * receiver joins an existing session using the session id
     */
    @PostMapping("/join/{sessionId}")
    public ResponseEntity<SessionResponse> joinSession(@PathVariable String sessionId, HttpServletRequest request){
        String clientIp = getClientIP(request);
        LoggerUtil.audit("join session request for sessionId=" + sessionId + ",and ip=" + clientIp);

        if(sessionId == null || sessionId.trim().isEmpty()){
            throw new IllegalArgumentException("session id cannot be empty");
        }

        String tempSocketId = "temp-" + System.currentTimeMillis();
        Session session = sessionService.joinSession(sessionId.toUpperCase(),tempSocketId,clientIp);

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
     * for now just returning session ID
     */
    private String generateQrCodeUrl(String sessionId){

        return sessionId;
    }
}
