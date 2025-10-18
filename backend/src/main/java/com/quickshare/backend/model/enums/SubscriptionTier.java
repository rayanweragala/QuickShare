package com.quickshare.backend.model.enums;

public enum SubscriptionTier {
    FREE(5368709120L, 24, 1073741824L, 10, 5),
    BASIC(21474836480L, 168, 5368709120L, 25, 20),
    PRO(107374182400L, 720, 10737418240L, 100, 100),
    ENTERPRISE(536870912000L, 8760, 53687091200L, 500, -1);

    private final Long maxRoomStorageBytes;
    private final Integer maxExpirationHours;
    private final Long maxFileSizeBytes;
    private final Integer maxParticipants;
    private final Integer maxConcurrentRooms;

    SubscriptionTier(Long maxRoomStorageBytes, Integer maxExpirationHours,
                     Long maxFileSizeBytes, Integer maxParticipants, Integer maxConcurrentRooms) {
        this.maxRoomStorageBytes = maxRoomStorageBytes;
        this.maxExpirationHours = maxExpirationHours;
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.maxParticipants = maxParticipants;
        this.maxConcurrentRooms = maxConcurrentRooms;
    }

    public Long getMaxRoomStorageBytes() { return maxRoomStorageBytes; }
    public Integer getMaxExpirationHours() { return maxExpirationHours; }
    public Long getMaxFileSizeBytes() { return maxFileSizeBytes; }
    public Integer getMaxParticipants() { return maxParticipants; }
    public Integer getMaxConcurrentRooms() { return maxConcurrentRooms; }
}