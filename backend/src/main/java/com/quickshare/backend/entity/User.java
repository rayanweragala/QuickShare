package com.quickshare.backend.entity;

import com.quickshare.backend.model.enums.SubscriptionTier;
import com.quickshare.backend.model.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * TODO: Track user accounts (optional, for paid features)
 * FUTURE: Maybe even let them pick a superhero avatar?
 * For now, just track anonymous usage — because who doesn't love a mysterious stranger?
 * TODO: Add more secret ninja stats for users later
 */
@Entity
@Table(name = "USERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "USER_ID")
    private Long id;

    @Column(name = "USER_UUID", unique = true, nullable = false)
    private String userUuid;

    @Column(name = "EMAIL", unique = true)
    private String email;

    @Column(name = "PASSWORD_HASH")
    private String passwordHash;

    @Column(name = "DISPLAY_NAME")
    private String displayName;

    @Column(name = "IS_ANONYMOUS", nullable = false)
    @Builder.Default
    private Boolean isAnonymous = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "SUBSCRIPTION_TIER", nullable = false)
    @Builder.Default
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    @Column(name = "SUBSCRIPTION_EXPIRES_AT")
    private LocalDateTime subscriptionExpiresAt;

    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "LAST_ACTIVE_AT")
    private LocalDateTime lastActiveAt;

    @Column(name = "TOTAL_ROOMS_CREATED", nullable = false)
    @Builder.Default
    private Integer totalRoomsCreated = 0;

    @Column(name = "TOTAL_FILES_UPLOADED", nullable = false)
    @Builder.Default
    private Long totalFilesUploaded = 0L;

    @Column(name = "TOTAL_STORAGE_USED", nullable = false)
    @Builder.Default
    private Long totalStorageUsed = 0L;

    @Column(name = "IS_BLOCKED", nullable = false)
    @Builder.Default
    private Boolean isBlocked = false;

    public boolean isPaid() {
        return subscriptionTier != SubscriptionTier.FREE &&
                subscriptionExpiresAt != null &&
                LocalDateTime.now().isBefore(subscriptionExpiresAt);
    }

    public boolean hasActiveSubscription() {
        return isPaid();
    }
}
