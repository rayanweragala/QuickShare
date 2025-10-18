package com.quickshare.backend.service.room;

import com.quickshare.backend.entity.UsageLimit;
import com.quickshare.backend.repository.UsageLimitRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class UsageLimitService {
    @Autowired
    private UsageLimitRepository usageLimitRepository;

    /**
     * check if user or ip is blocked
     */
    public boolean isBlocked(String userUuid, String ipAddress){
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);

        if (limit == null) {
            return false;
        }

        if(limit.getIsBlocked()){
            if(limit.getBlockedUntil() != null && LocalDateTime.now().isAfter(limit.getBlockedUntil())){
                limit.setIsBlocked(false);
                limit.setBlockedUntil(null);
                usageLimitRepository.save(limit);
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * get or create usage limit for user
     */
    @Transactional
    public UsageLimit getOrCreateLimit(String userUuid, String ipAddress) {
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);

        if(limit == null) {
            limit = UsageLimit.builder()
                    .userUuid(userUuid)
                    .ipAddress(ipAddress)
                    .resetDate(LocalDate.now().plusDays(1).atStartOfDay())
                    .build();

            limit = usageLimitRepository.save(limit);
        }

        if(LocalDateTime.now().isAfter(limit.getResetDate())) {
            resetDailyLimits(limit);
        }
        return limit;
    }

    /**
     * reset daily limit
     */
    @Transactional
    public void resetDailyLimits(UsageLimit limit) {
        limit.setRoomsCreatedToday(0);
        limit.setFilesUploadedToday(0);
        limit.setTotalRequestsToday(0);
        limit.setResetDate(LocalDate.now().plusDays(1).atStartOfDay());
        usageLimitRepository.save(limit);
    }

    /**
     * track room creation
     */
    @Transactional
    public void trackRoomCreation(String userUuid, String ipAddress) {
        UsageLimit limit = getOrCreateLimit(userUuid, ipAddress);
        limit.setRoomsCreatedToday(limit.getRoomsCreatedToday() + 1);
        limit.setLastRequestAt(LocalDateTime.now());
        usageLimitRepository.save(limit);
    }

    /**
     * track file upload
     */
    @Transactional
    public void trackFileUpload(String userUuid, String ipAddress) {
        UsageLimit limit = getOrCreateLimit(userUuid, ipAddress);
        limit.setFilesUploadedToday(limit.getFilesUploadedToday() + 1);
        limit.setLastRequestAt(LocalDateTime.now());
        usageLimitRepository.save(limit);
    }

    /**
     * track API request
     */
    @Transactional
    public void trackRequest(String userUuid, String ipAddress) {
        UsageLimit limit = getOrCreateLimit(userUuid, ipAddress);
        limit.setTotalRequestsToday(limit.getTotalRequestsToday() + 1);
        limit.setLastRequestAt(LocalDateTime.now());
        usageLimitRepository.save(limit);

        if (limit.getTotalRequestsToday() > 10000) {
            blockUser(userUuid, 24);
        }
    }

    /**
     * block user for specified hours
     */
    @Transactional
    public void blockUser(String userUuid, int hours) {
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);

        if (limit != null) {
            limit.setIsBlocked(true);
            limit.setBlockedUntil(LocalDateTime.now().plusHours(hours));
            usageLimitRepository.save(limit);
        }
    }

    /**
     * unblock user
     */
    @Transactional
    public void unblockUser(String userUuid) {
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);

        if (limit != null) {
            limit.setIsBlocked(false);
            limit.setBlockedUntil(null);
            usageLimitRepository.save(limit);
        }
    }

    /**
     * get usage statistics for user
     */
    @Transactional(readOnly = true)
    public UsageLimit getUserUsage(String userUuid) {
        return usageLimitRepository.findByUserUuid(userUuid).orElse(null);
    }

    /**
     * check if user has reached daily room limit
     */
    @Transactional(readOnly = true)
    public boolean hasReachedRoomLimit(String userUuid, String ipAddress) {
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);
        if (limit == null) {
            return false;
        }
        return limit.getRoomsCreatedToday() >= 5;
    }
    /**
     * check if user has reached daily upload limit
     */
    @Transactional(readOnly = true)
    public boolean hasReachedUploadLimit(String userUuid, String ipAddress) {
        UsageLimit limit = usageLimitRepository.findByUserUuid(userUuid).orElse(null);
        if (limit == null) {
            return false;
        }
        return limit.getFilesUploadedToday() >= 50;
    }
}
