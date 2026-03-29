package com.quickshare.backend.service.room;

import com.quickshare.backend.util.LoggerUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ExpiredRoomFilesCleanupListener {
    private final CloudflareR2Service cloudflareR2Service;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleExpiredRoomFilesCleanup(ExpiredRoomFilesCleanupEvent event) {
        for (String key : event.keysToDelete()) {
            try {
                cloudflareR2Service.deleteFile(key);
            } catch (Exception ex) {
                LoggerUtil.warn(ExpiredRoomFilesCleanupListener.class,
                        "failed to delete file=" + key + "," + ex.getMessage());
            }
        }
    }
}
