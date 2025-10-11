package com.localshare.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.localshare.backend.handler.SocketIOEventHandler;
import com.localshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * initializes socketIO event handlers on application startup
 * registers all event listeners with the socketIo server
 */
@Component
@RequiredArgsConstructor
public class SocketIOConfig implements CommandLineRunner {

    private final SocketIOServer socketIOServer;
    private final SocketIOEventHandler eventHandler;

    @Override
    public void run(String... args){
        socketIOServer.addListeners(eventHandler);
        LoggerUtil.audit("socketIO event handlers registered successfully");
    }
}
