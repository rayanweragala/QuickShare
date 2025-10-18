package com.localshare.backend;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.localshare.backend.util.LoggerUtil;
import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

/**
 * main spring boot application for localshare peer to peer file sharing backend
 * this class read main configuration properties and configures the socketIO signaling server
 */
@SpringBootApplication
public class LocalShareBackendApplication {
    @Value("${socketio.host}")
    private String socketHost;
    @Value("${socketio.port}")
    private Integer socketPort;

    @Value("${socketio.boss-threads}")
    private Integer bossThreads;

    @Value("${socketio.worker-threads}")
    private Integer workerThreads;

    @Value("${socketio.max-frame-payload-length}")
    private Integer maxFramePayloadLength;

    @Value("${socketio.max-http-content-length}")
    private Integer maxHttpContentLength;
    private SocketIOServer socketIOServer;

    public static void main(String[] args) {
        LoggerUtil.audit("=== LocalShare Backend Starting ===");
        SpringApplication.run(LocalShareBackendApplication.class, args);
        LoggerUtil.audit("=== LocalShare Backend Started Successfully ===");
    }

    @Bean
    public SocketIOServer socketIOServer(){
        LoggerUtil.info(LocalShareBackendApplication.class,
                "Configuring socketIO server on " + socketHost + ":" + socketPort);

        Configuration configuration = new Configuration();
        configuration.setHostname(socketHost);
        configuration.setPort(socketPort);
        configuration.setBossThreads(bossThreads);
        configuration.setWorkerThreads(workerThreads);
        configuration.setMaxFramePayloadLength(maxFramePayloadLength);
        configuration.setMaxHttpContentLength(maxHttpContentLength);

        socketIOServer = new SocketIOServer(configuration);
        socketIOServer.start();

        LoggerUtil.audit("socketIO server started on port " + socketPort);
        return socketIOServer;
    }

    @PreDestroy
    public void onShutdown(){
        if(socketIOServer != null){
            LoggerUtil.audit("shutting down socketIO server...");
            socketIOServer.stop();
            LoggerUtil.audit("shutdown success");
        }
    }
}
