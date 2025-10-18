package com.quickshare.backend.repository;

import com.quickshare.backend.entity.UsageLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsageLimitRepository extends JpaRepository<UsageLimit,Long> {
    Optional<UsageLimit> findByUserUuid(String userUuid);
    Optional<UsageLimit> findByIpAddress(String ipAddress);
    List<UsageLimit> findByResetDateBefore(LocalDateTime date);
    List<UsageLimit> findByIsBlockedAndBlockedUntilBefore(Boolean isBlocked, LocalDateTime date);
    List<UsageLimit> findByIsBlocked(Boolean isBlocked);
}
