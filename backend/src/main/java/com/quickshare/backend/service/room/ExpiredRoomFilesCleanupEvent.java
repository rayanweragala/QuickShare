package com.quickshare.backend.service.room;

import java.util.List;

public record ExpiredRoomFilesCleanupEvent(List<String> keysToDelete) {
}
