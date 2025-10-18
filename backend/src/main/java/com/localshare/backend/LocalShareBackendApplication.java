package com.localshare.backend;

import com.localshare.backend.util.LoggerUtil;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * main spring boot application for localshare peer to peer file sharing backend
 * uses native Spring WebSocket for real-time signaling
 */
@SpringBootApplication
public class LocalShareBackendApplication {

    public static void main(String[] args) {
        LoggerUtil.audit("=== LocalShare Backend Starting ===");
        SpringApplication.run(LocalShareBackendApplication.class, args);
        LoggerUtil.audit("=== LocalShare Backend Started Successfully ===");
    }
}