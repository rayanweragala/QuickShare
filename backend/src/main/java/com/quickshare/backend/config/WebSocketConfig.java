package com.quickshare.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * WebSocket configuration
 * Registers WebSocket endpoints and handlers
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private org.springframework.web.socket.WebSocketHandler webSocketHandler;
    @Autowired
    private CorsConfig corsConfig;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(webSocketHandler, "/socket.io/")
                .setAllowedOrigins(corsConfig.getAllowedOrigins().toArray(new String[0]))
                .addInterceptors(new HttpSessionHandshakeInterceptor());
    }
}
