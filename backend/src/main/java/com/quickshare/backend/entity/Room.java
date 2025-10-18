package com.quickshare.backend.entity;

import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import com.quickshare.backend.model.enums.SubscriptionTier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ROOMS", indexes = {
        @Index(name = "idx_room_code", columnList = "ROOM_CODE", unique = true),
        @Index(name = "idx_room_visibility_status", columnList = "ROOM_VISIBILITY,ROOM_STATUS"),
        @Index(name = "idx_creator_ip", columnList = "CREATOR_IP"),
        @Index(name = "idx_expires_at", columnList = "EXPIRES_AT"),
        @Index(name = "idx_last_activity_at", columnList = "LAST_ACTIVITY_AT"),
        @Index(name = "idx_status", columnList = "ROOM_STATUS"),
        @Index(name = "idx_created_at", columnList = "CREATED_AT")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROOM_ID")
    private Long id;

    @Column(name = "ROOM_CODE",unique = true,nullable = false,length = 8)
    private String roomCode;

    @Column(name = "ROOM_NAME",nullable = false)
    private String roomName;

    @Column(name = "ROOM_ICON",nullable = false)
    private String roomIcon;

    @Column(name = "CREATOR_ANIMAL_NAME", nullable = false)
    private String creatorAnimalName;

    @Column(name = "CREATOR_SOCKET_ID", nullable = false)
    private String creatorSocketId;

    @Column(name = "CREATOR_IP", nullable = false)
    private String creatorIp;

    @Column(name = "CREATOR_USER_ID")
    private String creatorUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROOM_VISIBILITY", nullable = false)
    private RoomVisibility roomVisibility;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROOM_STATUS", nullable = false)
    @Builder.Default
    private RoomStatus status = RoomStatus.ACTIVE;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<RoomFile> files = new HashSet<>();

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<RoomParticipant> participants = new HashSet<>();

    @Column(name = "MAX_STORAGE_BYTES", nullable = false)
    @Builder.Default
    private Long maxStorageBytes = 5368709120L;

    @Column(name = "CURRENT_STORAGE_BYTES", nullable = false)
    @Builder.Default
    private Long currentStorageBytes = 0L;

    @Column(name = "MAX_PARTICIPANTS", nullable = false)
    @Builder.Default
    private Integer maxParticipants = 10;

    @Column(name = "CREATOR_ONLY_UPLOAD", nullable = false)
    @Builder.Default
    private Boolean creatorOnlyUpload = false;

    @Column(name = "EXPIRATION_HOURS",nullable = false)
    @Builder.Default
    private Integer expirationHours = 24;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "LAST_ACTIVITY_AT")
    private LocalDateTime lastActivityAt;

    @Column(name = "EXPIRES_AT")
    private LocalDateTime expiresAt;

    @Column(name = "TOTAL_VISITORS", nullable = false)
    @Builder.Default
    private Long totalVisitors = 0L;

    @Enumerated(EnumType.STRING)
    @Column(name = "SUBSCRIPTION_TIER", nullable = false)
    @Builder.Default
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    @Column(name = "IS_FEATURED", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    public void addFiles(RoomFile file) {
        files.add(file);
        file.setRoom(this);
        this.currentStorageBytes += file.getFileSize();
    }

    public void removeFile(RoomFile file) {
        files.remove(file);
        file.setRoom(null);
        this.currentStorageBytes -= file.getFileSize();
    }

    public void addParticipant(RoomParticipant participant) {
        participants.add(participant);
        participant.setRoom(this);
    }

    public void removeParticipant(RoomParticipant participant) {
        participants.remove(participant);
        participant.setRoom(null);
    }

    public boolean hasStorageSpace(long fileSize) {
        return (currentStorageBytes + fileSize) <= maxStorageBytes;
    }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isFull() {
        return participants.size() >= maxParticipants;
    }

    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
    }
}
