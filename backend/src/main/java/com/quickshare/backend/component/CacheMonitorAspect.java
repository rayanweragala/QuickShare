package com.quickshare.backend.component;

import com.quickshare.backend.util.LoggerUtil;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Aspect
@Component
public class CacheMonitorAspect {

    @Autowired
    private CacheManager cacheManager;

    @Around("within(com.quickshare.backend..*) && @annotation(cacheable)")
    public Object monitorCacheable(ProceedingJoinPoint joinPoint, Cacheable cacheable) throws Throwable {
        String cacheName = cacheable.value()[0];
        String methodName = joinPoint.getSignature().getName();
        Object[] args = joinPoint.getArgs();

        LoggerUtil.audit("cache operation=" + methodName + ",cache=" + cacheName + ",args=" + Arrays.toString(args));
        Object result = joinPoint.proceed(args);

        return result;
    }
}
