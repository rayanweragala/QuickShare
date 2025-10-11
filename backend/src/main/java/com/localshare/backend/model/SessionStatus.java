package com.localshare.backend.model;

/**
 * lifecycle states of a file sharing session
 */
public enum SessionStatus {
    WAITING,CONNECTED,TRANSFERRING,COMPLETED,EXPIRED,ERROR
}
