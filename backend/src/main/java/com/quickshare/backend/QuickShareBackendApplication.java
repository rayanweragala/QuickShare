package com.quickshare.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * main spring boot application for QuickShare peer to peer file sharing backend
 * uses native Spring WebSocket for real-time signaling
 */
@SpringBootApplication
@EnableScheduling
public class QuickShareBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuickShareBackendApplication.class, args);
    }
}