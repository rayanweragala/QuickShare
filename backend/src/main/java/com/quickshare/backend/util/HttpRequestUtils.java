package com.quickshare.backend.util;

import jakarta.servlet.http.HttpServletRequest;

public final class HttpRequestUtils {
    private HttpRequestUtils() {
    }

    public static String extractUserId(HttpServletRequest request) {
        String id = request.getHeader("X-User-ID");
        if (id == null) {
            id = request.getHeader("X-User-Session");
        }
        if (id == null) {
            id = "anonymous";
        }
        return id;
    }
}
