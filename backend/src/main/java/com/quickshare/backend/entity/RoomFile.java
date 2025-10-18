package com.quickshare.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ROOM_FILES", indexes = {
        @Index(name = "idx_file_id", columnList = "FILE_ID", unique = true),
        @Index(name = "idx_room_id_available", columnList = "ROOM_ID,IS_AVAILABLE"),
        @Index(name = "idx_cloudflare_key", columnList = "CLOUD_FLARE_KEY"),
        @Index(name = "idx_uploader_socket_id", columnList = "UPLOADER_SOCKET_ID"),
        @Index(name = "idx_file_expires_at", columnList = "EXPIRES_AT"),
        @Index(name = "idx_uploaded_at", columnList = "UPLOADED_AT")
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RoomFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ROOM_FILE_ID")
    private Long id;

    @Column(name = "FILE_ID",nullable = false, unique = true)
    private String fileId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ROOM_ID", nullable = false)
    private Room room;

    @Column(name = "FILE_NAME",nullable = false)
    private String fileName;

    @Column(name = "FILE_TYPE", nullable = false)
    private String fileType;

    @Column(name = "FILE_SIZE", nullable = false)
    private Long fileSize;

    @Column(name = "CLOUD_FLARE_KEY", nullable = false)
    private String cloudFlareKey;

    @Column(name = "CLOUD_FLARE_URL",nullable = false)
    private String cloudFlareUrl;

    @Column(name = "UPLOADER_ANIMAL_NAME", nullable = false)
    private String uploaderAnimalName;

    @Column(name = "UPLOADER_SOCKET_ID", nullable = false)
    private String uploaderSocketId;

    @Column(name = "CHECKSUM")
    private String checksum;

    @Column(name = "DOWNLOAD_COUNT",nullable = false)
    @Builder.Default
    private Long downloadCount = 0L;

    @CreationTimestamp
    @Column(name = "UPLOADED_AT",nullable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "EXPIRES_AT")
    private LocalDateTime expiresAt;

    @Column(name = "IS_AVAILABLE", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    public void incrementDownloadCount() {
        this.downloadCount++;
    }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}
