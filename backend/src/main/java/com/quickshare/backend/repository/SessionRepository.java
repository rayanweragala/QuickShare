package com.quickshare.backend.repository;

import com.quickshare.backend.model.Session;
import com.quickshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.concurrent.TimeUnit;

/**
 * repository for session data access in redis
 * handles crud and TTL(time to live) management for sessions
 */
@Repository
@RequiredArgsConstructor
public class SessionRepository {
    private final String SESSION_KEY_PREFIX = "session:";
    private final int DEFAULT_TTL_MINUTES = 30;

    private final RedisTemplate<String, Session> sessionRedisTemplate;

    /**
     *save session with custom TTL
     */
    public void save(Session session, int timeoutMinutes){
        String key = SESSION_KEY_PREFIX + session.getSessionId();
        sessionRedisTemplate.opsForValue().set(key, session, timeoutMinutes, TimeUnit.MINUTES);

        LoggerUtil.audit("session saved to redis, sessionId=" + session.getSessionId() + ",ttl=" + timeoutMinutes + "min");
    }

    /**
     * save session with default TTL (30 minutes)
     */
    public void save(String sessionId, Session session) {
        save(session, DEFAULT_TTL_MINUTES);
    }

    public Session findById(String sessionId){
        String key  = SESSION_KEY_PREFIX + sessionId;
        Session session = sessionRedisTemplate.opsForValue().get(key);

        if(session != null){
            LoggerUtil.dev("session found for sessionId=" + sessionId);
        } else {
            LoggerUtil.dev("session not found for sessionId=" + sessionId);
        }
        return session;
    }

    public void update(Session session, int timeoutMinutes){
        String key = SESSION_KEY_PREFIX + session.getSessionId();

        Boolean exists = sessionRedisTemplate.hasKey(key);
        if(exists){
            sessionRedisTemplate.opsForValue().set(key, session, timeoutMinutes, TimeUnit.MINUTES);
            LoggerUtil.audit("session updated for sessionId= " + session.getSessionId());
        } else {
            LoggerUtil.warn(SessionRepository.class, "session not available for sessionId=" + session.getSessionId());
        }
    }

    /**
     * update session with default TTL
     */
    public void update(Session session) {
        update(session, DEFAULT_TTL_MINUTES);
    }

    public boolean delete(String sessionId){
        String key = SESSION_KEY_PREFIX + sessionId;

        Boolean deleted = sessionRedisTemplate.delete(key);
        if(deleted){
            LoggerUtil.audit("session deleted for sessionId=" + sessionId);
            return true;
        } else {
            LoggerUtil.warn(SessionRepository.class, "session not available for sessionId=" + sessionId);
            return false;
        }
    }

    public boolean exists(String sessionId) {
        String key = SESSION_KEY_PREFIX + sessionId;
        return sessionRedisTemplate.hasKey(key);
    }

    public boolean refreshTTL(String sessionId, int timeoutMinutes){
        String key = SESSION_KEY_PREFIX + sessionId;

        Boolean result = sessionRedisTemplate.expire(key, timeoutMinutes, TimeUnit.MINUTES);
        if(result){
            LoggerUtil.dev("session TTL refreshed for sessionId=" + sessionId + ",newTTL=" + timeoutMinutes + "min");
            return true;
        }
        return false;
    }
}