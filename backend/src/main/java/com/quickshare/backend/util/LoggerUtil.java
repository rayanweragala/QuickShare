package com.quickshare.backend.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
public class LoggerUtil {
    private static final Logger AUDIT_LOGGER = LoggerFactory.getLogger("audit-log");
    private static final Logger DEV_LOGGER = LoggerFactory.getLogger("dev-log");

    public static void audit(String message) {
        AUDIT_LOGGER.info(message);
    }
    public static void dev(String message) {
        DEV_LOGGER.debug(message);
    }
    public static void info(Class<?> clazz, String message) {
        Logger logger = LoggerFactory.getLogger(clazz);
        logger.info(message);
    }
    public static void warn(Class<?> clazz, String message) {
        Logger logger = LoggerFactory.getLogger(clazz);
        logger.warn(message);
    }
    public static void error(Class<?> clazz, String message, Throwable throwable) {
        Logger logger = LoggerFactory.getLogger(clazz);
        logger.error(message, throwable);
    }
}
