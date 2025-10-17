package com.quickshare.backend.schedular;

import com.quickshare.backend.service.room.CloudflareR2Service;
import com.quickshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class R2CleanupScheduler {
    private final CloudflareR2Service cloudflareR2Service;

    /**
     * cleanup incomplete multipart uploads
     * Runs every 30 minutes
     */
    @Scheduled(cron = "0 */30 * * * ?")
    public void cleanupIncompleteUploads() {
        LoggerUtil.audit("Starting scheduled cleanup of incomplete R2 uploads");

        try {
            int cleanedCount = cloudflareR2Service.cleanupIncompleteUploads();

            if (cleanedCount > 0) {
                LoggerUtil.audit("Cleaned up " + cleanedCount + " incomplete uploads from R2");
            } else {
                LoggerUtil.audit("No incomplete uploads found in R2");
            }
        } catch (Exception e) {
            LoggerUtil.error(R2CleanupScheduler.class,
                    "Failed to cleanup incomplete uploads: " + e.getMessage(), e);
        }
    }
}
