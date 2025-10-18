package com.quickshare.backend.model.enums;

/**
 * lifecycle states of a file sharing session
 */
public enum SessionStatus {
    WAITING,CONNECTED,TRANSFERRING,COMPLETED,EXPIRED,ERROR,BROADCASTING
}
