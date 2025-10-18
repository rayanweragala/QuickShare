package com.quickshare.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ROOM_PARTICIPANTS", indexes = {
        @Index(name = "idx_room_socket_id", columnList = "ROOM_ID,SOCKET_ID", unique = true),
        @Index(name = "idx_room_online", columnList = "ROOM_ID,IS_ONLINE"),
        @Index(name = "idx_joined_at", columnList = "JOINED_AT"),
        @Index(name = "idx_last_seen_at", columnList = "LAST_SEEN_AT")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROOM_PARTICIPANT_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOM_ID", nullable = false)
    private Room room;

    @Column(name= "SOCKET_ID", nullable = false)
    private String socketId;

    @Column(name= "ANIMAL_NAME",nullable = false)
    private String animalName;

    @Column(name= "ANIMAL_ICON",nullable = false)
    private String animalIcon;

    @Column(name= "AVATAR_COLOR",nullable = false)
    private String avatarColor;

    @Column(name= "IP_ADDRESS")
    private String ipAddress;

    @Column(name= "IS_CREATOR",nullable = false)
    @Builder.Default
    private Boolean isCreator = false;

    @Column(name= "IS_ONLINE",nullable = false)
    @Builder.Default
    private Boolean isOnline = true;

    @CreationTimestamp
    @Column(name= "JOINED_AT",nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @UpdateTimestamp
    private LocalDateTime lastSeenAt;

    private LocalDateTime leftAt;
}
