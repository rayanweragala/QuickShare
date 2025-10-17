package com.quickshare.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "USAGE_LIMITS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsageLimit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USAGE_LIMIT_ID")
    private Long id;

    @Column(name = "USER_UUID", nullable = false, unique = true)
    private String userUuid;

    @Column(name = "IP_ADDRESS")
    private String ipAddress;

    @Column(name = "ROOMS_CREATED_TODAY", nullable = false)
    @Builder.Default
    private Integer roomsCreatedToday = 0;

    @Column(name = "FILES_UPLOADED_TODAY", nullable = false)
    @Builder.Default
    private Integer filesUploadedToday = 0;

    @Column(name = "TOTAL_REQUESTS_TODAY", nullable = false)
    @Builder.Default
    private Integer totalRequestsToday = 0;

    @Column(name = "LAST_REQUEST_AT")
    private LocalDateTime lastRequestAt;

    @Column(name = "RESET_DATE", nullable = false)
    private LocalDateTime resetDate;

    @Column(name = "IS_BLOCKED", nullable = false)
    @Builder.Default
    private Boolean isBlocked = false;

    @Column(name = "BLOCKED_UNTIL")
    private LocalDateTime blockedUntil;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
