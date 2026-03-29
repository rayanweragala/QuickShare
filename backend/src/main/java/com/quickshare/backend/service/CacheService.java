package com.quickshare.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CacheService {

    private final CacheManager cacheManager;

    public void evictRoomCaches(Long roomId) {
        evictCache("rooms",roomId);
        evictCache("roomDetails",roomId);
        Objects.requireNonNull(cacheManager.getCache("publicRooms")).clear();
        Objects.requireNonNull(cacheManager.getCache("privateRooms")).clear();
        evictCache("roomParticipants",roomId);
        evictCache("roomFiles",roomId);
    }

    public void evictPublicRoomsCache() {
        Objects.requireNonNull(cacheManager.getCache("publicRooms")).clear();
    }

    public void evictRoomDetails(Long roomId) {
        evictCache("roomDetails",roomId);
    }

    public void updateRoomInCache(Long roomId, Object roomData) {
        Cache cache = cacheManager.getCache("rooms");
        if(cache != null) {
            cache.put(roomId,roomData);
        }
    }

    public <T> Optional<T> getFromCache(String cacheName, Object key, Class<T> type) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            Cache.ValueWrapper wrapper = cache.get(key);
            if (wrapper != null) {
                return Optional.ofNullable(type.cast(wrapper.get()));
            }
        }
        return Optional.empty();
    }

    public void evictCache(String cacheName, Object key) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.evict(key);
        }
    }
}
