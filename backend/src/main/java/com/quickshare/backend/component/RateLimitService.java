package com.quickshare.backend.component;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;

@Component
public class RateLimitService {
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    private static final int MAX_DAILY_REQUESTS = 1000;
    private static final int MAX_HOURLY_REQUESTS = 100;
    private static final int MAX_ROOM_CREATIONS_PER_DAY = 50;
    private static final int MAX_FILE_UPLOADS_PER_DAY = 50;

    /**
     * generic rate limit check
     */
    public boolean checkRateLimit(String userUuid, String action, int maxRequests) {
        String key = "rate_limit:" + userUuid + ":" + action + ":" + LocalDate.now();
        return incrementAndCheck(key, maxRequests, Duration.ofDays(1));
    }

    /**
     * check if user can create a room today
     */
    public boolean canCreateRoom(String userUuid) {
        String key = "rate_limit:rooms:" + userUuid + ":" + LocalDate.now();
        return incrementAndCheck(key, MAX_ROOM_CREATIONS_PER_DAY, Duration.ofDays(1));
    }

    /**
     * check if user can upload a file today
     */
    public boolean canUploadFile(String userUuid) {
        String key = "rate_limit:uploads:" + userUuid + ":" + LocalDate.now();
        return incrementAndCheck(key, MAX_FILE_UPLOADS_PER_DAY, Duration.ofDays(1));
    }

    /**
     * check hourly rate limit
     */
    public boolean checkHourlyRateLimit(String userUuid) {
        long currentHour = System.currentTimeMillis() / (60 * 60 * 1000);
        String key = "rate_limit:hourly:" + userUuid + ":" + currentHour;
        return incrementAndCheck(key, MAX_HOURLY_REQUESTS, Duration.ofHours(1));
    }

    /**
     * get remaining requests for today
     */
    public int getRemainingRequests(String userUuid) {
        String key = "rate_limit:" + userUuid + ":api_request:" + LocalDate.now();
        String count = redisTemplate.opsForValue().get(key);
        int used = count != null ? Integer.parseInt(count) : 0;
        return Math.max(0, MAX_DAILY_REQUESTS - used);
    }

    /**
     * get remaining room creations for today
     */
    public int getRemainingRoomCreations(String userUuid) {
        String key = "rate_limit:rooms:" + userUuid + ":" + LocalDate.now();
        String count = redisTemplate.opsForValue().get(key);
        int used = count != null ? Integer.parseInt(count) : 0;
        return Math.max(0, MAX_ROOM_CREATIONS_PER_DAY - used);
    }

    /**
     * get remaining file uploads for today
     */
    public int getRemainingFileUploads(String userUuid) {
        String key = "rate_limit:uploads:" + userUuid + ":" + LocalDate.now();
        String count = redisTemplate.opsForValue().get(key);
        int used = count != null ? Integer.parseInt(count) : 0;
        return Math.max(0, MAX_FILE_UPLOADS_PER_DAY - used);
    }

    /**
     * reset rate limit for a user (admin function)
     */
    public void resetRateLimit(String userUuid) {
        String pattern = "rate_limit:" + userUuid + ":*";
        var keys = redisTemplate.keys(pattern);
        if (!keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }

    /**
     * increment counter and check if within limit
     */
    private boolean incrementAndCheck(String key, int maxAllowed, Duration ttl) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);

            if (count == null) {
                return false;
            }

            if (count == 1) {
                redisTemplate.expire(key, ttl);
            }

            return count <= maxAllowed;
        } catch (Exception e) {
            System.err.println("Redis error in rate limiting: " + e.getMessage());
            return true;
        }
    }

    /**
     * manually increment counter (for tracking without checking)
     */
    public void trackAction(String userUuid, String action) {
        String key = "rate_limit:" + userUuid + ":" + action + ":" + LocalDate.now();
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, Duration.ofDays(1));
    }
}
