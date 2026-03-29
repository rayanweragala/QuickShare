package com.quickshare.backend.component;

import com.quickshare.backend.config.CorsConfig;
import com.quickshare.backend.service.room.UsageLimitService;
import com.quickshare.backend.util.HttpRequestUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

@Component
public class SecurityInterceptor implements HandlerInterceptor {
    @Autowired
    private RateLimitService rateLimitService;
    @Autowired
    private UsageLimitService usageLimitService;
    @Autowired
    private CorsConfig corsConfig;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String userUuid = extractUserUuid(request);
        String ipAddress = getClientIp(request);

        if (usageLimitService.isBlocked(userUuid, ipAddress)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Access blocked due to abuse. Contact support.\"}");
            return false;
        }

        if (!rateLimitService.checkRateLimit(userUuid, "api_request", 1000)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Try again tomorrow.\"}");
            return false;
        }

        if (!isValidOrigin(request)) {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Invalid origin\"}");
            return false;
        }

        request.setAttribute("userUuid", userUuid);
        request.setAttribute("ipAddress", ipAddress);

        return true;
    }

    /**
     * extract user UUID from header or generate temporary one
     */
    private String extractUserUuid(HttpServletRequest request) {
        String uuid = HttpRequestUtils.extractUserId(request);

        if ("anonymous".equals(uuid)) {
            uuid = null;
        }

        if (uuid != null && (uuid.length() > 128 || !uuid.matches("[a-zA-Z0-9\\-_]+"))) {
            uuid = null;
        }

        if (uuid != null && !uuid.trim().isEmpty()) {
            return uuid.trim();
        }

        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        if (userAgent == null) {
            userAgent = "unknown";
        }

        return "anon-" + generateHash(ip + "|" + userAgent);
    }

    /**
     * get client IP address (handles proxies)
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }

        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }

    /**
     * Validate request origin
     */
    private boolean isValidOrigin(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String referer = request.getHeader("Referer");

        if (origin == null && referer != null) {
            try {
                java.net.URI uri = new java.net.URI(referer);
                origin = uri.getScheme() + "://" + uri.getHost() +
                        (uri.getPort() != -1 ? ":" + uri.getPort() : "");
            } catch (Exception e) {
                return false;
            }
        }

        if (origin == null) {
            String method = request.getMethod();
            if ("GET".equals(method) || "HEAD".equals(method)) {
                return true;
            }
            return false;
        }

        final String finalOrigin = origin;
        return corsConfig.getAllowedOrigins().stream()
                .anyMatch(finalOrigin::startsWith);
    }

    /**
     * generate short hash from string
     */
    private String generateHash(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(hash)
                    .substring(0, 16);
        } catch (Exception e) {
            return String.valueOf(Math.abs(input.hashCode()));
        }
    }
}
