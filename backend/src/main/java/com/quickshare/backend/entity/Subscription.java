package com.quickshare.backend.entity;

import com.quickshare.backend.model.enums.SubscriptionStatus;
import com.quickshare.backend.model.enums.SubscriptionTier;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "SUBSCRIPTIONS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SUBSCRIPTION_ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "USER_ID", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "TIER", nullable = false)
    private SubscriptionTier tier;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false)
    private SubscriptionStatus status;

    @Column(name = "STRIPE_SUBSCRIPTION_ID")
    private String stripeSubscriptionId;

    @Column(name = "STRIPE_CUSTOMER_ID")
    private String stripeCustomerId;

    @CreationTimestamp
    @Column(name = "STARTED_AT", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "EXPIRES_AT")
    private LocalDateTime expiresAt;

    @Column(name = "CANCELLED_AT")
    private LocalDateTime cancelledAt;

    @UpdateTimestamp
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}
