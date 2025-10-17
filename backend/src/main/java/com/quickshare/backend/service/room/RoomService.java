package com.quickshare.backend.service.room;

import com.quickshare.backend.component.RateLimitService;
import com.quickshare.backend.dto.room.*;
import com.quickshare.backend.entity.Room;
import com.quickshare.backend.entity.RoomParticipant;
import com.quickshare.backend.handler.WebSocketHandler;
import com.quickshare.backend.mapper.RoomMapper;
import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import com.quickshare.backend.model.room.RoomProjection;
import com.quickshare.backend.repository.RoomParticipantRepository;
import com.quickshare.backend.repository.RoomRepository;
import com.quickshare.backend.service.CacheService;
import com.quickshare.backend.util.AnimalNameGenerator;
import com.quickshare.backend.util.LoggerUtil;
import com.quickshare.backend.util.StringUtilities;
import jakarta.persistence.criteria.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final RateLimitService rateLimitService;
    private final UsageLimitService usageLimitService;
    private final StringUtilities stringUtilities;
    private final CloudflareR2Service cloudflareR2Service;
    private final CacheService cacheService;
    private final RoomCacheService roomCacheService;
    private final WebSocketHandler webSocketHandler;
    @Transactional
    @CacheEvict(value = {"publicRooms","rooms","privateRooms"}, allEntries = true)
    public RoomResponse createRoom(CreateRoomRequest request, String userId, String ipAddress) {
        if(!rateLimitService.canCreateRoom(userId)) {
            throw new RuntimeException("room creation limit exceeded for today");
        }

        usageLimitService.trackRoomCreation(userId,ipAddress);
        String roomCode = stringUtilities.generateUniqueRoomCode();
        var animalIdentity = AnimalNameGenerator.generateRandomAnimal();

        RoomVisibility visibility = request.getVisibility() != null ? request.getVisibility() : RoomVisibility.PRIVATE;

        int expirationHours = request.getExpirationHours() != null ? request.getExpirationHours() : 24;

        String roomName = (request.getCustomRoomName() != null && !request.getCustomRoomName().isBlank())
                ? request.getCustomRoomName()
                : animalIdentity.getName() + "'s Room";

        Room room = Room.builder()
                .roomCode(roomCode)
                .roomName(roomName)
                .roomIcon(animalIdentity.getIcon())
                .creatorAnimalName(animalIdentity.getName())
                .creatorSocketId("")
                .creatorUserId(request.getUserId())
                .creatorIp(ipAddress)
                .roomVisibility(visibility)
                .status(RoomStatus.ACTIVE)
                .maxStorageBytes(request.getMaxStorageBytes() != null ? request.getMaxStorageBytes() : 5368709120L)
                .maxParticipants(request.getMaxParticipants() != null ? request.getMaxParticipants() : 10)
                .creatorOnlyUpload(request.getCreatorOnlyUpload() != null ? request.getCreatorOnlyUpload() : false)
                .expirationHours(expirationHours)
                .expiresAt(LocalDateTime.now().plusHours(expirationHours))
                .lastActivityAt(LocalDateTime.now())
                .totalVisitors(1L)
                .isFeatured(request.getIsFeatured())
                .build();

        room = roomRepository.save(room);

        RoomParticipant creatorParticipant = RoomParticipant.builder()
                .room(room)
                .socketId("creator-initial")
                .userId(request.getUserId())
                .animalName(animalIdentity.getName())
                .animalIcon(animalIdentity.getIcon())
                .avatarColor(animalIdentity.getColor())
                .ipAddress(ipAddress)
                .isCreator(true)
                .isOnline(true)
                .build();

        room.addParticipant(creatorParticipant);
        Room savedRoom = roomRepository.save(room);
        cacheService.updateRoomInCache(room.getId(),RoomMapper.mapToRoomResponse(room));
        RoomResponse response = RoomMapper.mapToRoomResponse(savedRoom);
        webSocketHandler.broadcastPublicRoomsUpdate();
        if (Boolean.TRUE.equals(request.getIsFeatured())) {
            List<RoomResponse> featuredRooms = getFeaturedRoomsForUser(request.getUserId());
            webSocketHandler.broadcastFeaturedRoomsToUser(request.getUserId(), featuredRooms);
            LoggerUtil.audit("broadcasting featured rooms update after room creation for userId=" + request.getUserId());
        }

        return response;
    }

    @Transactional
    public RoomDetailsResponse joinRoom(String roomCode,  String socketId, String ipAddress, String userId) {
        Room room = roomRepository.findByRoomCode(roomCode).orElseThrow(() -> new RuntimeException("room not found"));

        Long roomId = room.getId();

        if(room.isExpired()) {
            room.setStatus(RoomStatus.EXPIRED);
            roomRepository.save(room);
            cacheService.evictRoomCaches(roomId);
            throw new RuntimeException("room has expired");
        }

        if(room.isFull()){
            throw new RuntimeException("room is full");
        }

        Optional<RoomParticipant> existingParticipant = room.getParticipants().stream().filter(p->p.getUserId() != null && p.getUserId().equals(userId)).findFirst();

        RoomParticipant roomParticipant;

        if(existingParticipant.isPresent()){
            roomParticipant = existingParticipant.get();
            roomParticipant.setSocketId(socketId);
            roomParticipant.setIsOnline(true);
            roomParticipant.setLastSeenAt(LocalDateTime.now());
            roomParticipant.setIpAddress(ipAddress);

            LoggerUtil.audit("User rejoined room=" + userId + " with new session=" + socketId);
        } else {
            Set<String> existingNames = room.getParticipants().stream()
                    .map(RoomParticipant::getAnimalName)
                    .collect(Collectors.toSet());

            var animalIdentity = AnimalNameGenerator.generateUniqueAnimal(existingNames);
            boolean isCreator = userId.equals(room.getCreatorUserId());

            roomParticipant = RoomParticipant.builder()
                    .room(room)
                    .socketId(socketId)
                    .userId(userId)
                    .animalName(animalIdentity.getName())
                    .animalIcon(animalIdentity.getIcon())
                    .avatarColor(animalIdentity.getColor())
                    .ipAddress(ipAddress)
                    .isCreator(isCreator)
                    .isOnline(true)
                    .build();

            room.addParticipant(roomParticipant);
            room.setTotalVisitors(room.getTotalVisitors() + 1);

            LoggerUtil.audit("new user joined room=" + userId + " with session=" + socketId + ", isCreator=" + isCreator);
        }

        room.updateActivity();
        roomRepository.save(room);

        cacheService.evictRoomDetails(roomId);
        cacheService.evictCache("roomParticipants", roomId);

        if (room.getRoomVisibility() == RoomVisibility.PUBLIC) {
            cacheService.evictPublicRoomsCache();
        }
        RoomDetailsResponse response = roomCacheService.getRoomDetails(room.getId());
        webSocketHandler.broadcastRoomUpdate(roomCode, response);
        webSocketHandler.broadcastPublicRoomsUpdate();

        return response;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "roomDetails", key = "#roomId", unless = "#result == null ")
    public RoomDetailsResponse getRoomDetails(Long roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("room not found"));

        List<ParticipantInfo> participants = room.getParticipants().stream().map(RoomMapper::mapToParticipantInfo).collect(Collectors.toList());

        List<FileInfo> files = room.getFiles().stream().map(RoomMapper::mapToFileInfo).collect(Collectors.toList());

        RoomStats stats = RoomStats.builder()
                .totalFiles(files.size())
                .totalStorageUsed(room.getCurrentStorageBytes())
                .totalDownloads(files.stream().mapToLong(FileInfo::getDownloadCount).sum())
                .totalVisitors(room.getTotalVisitors())
                .activeParticipants(room.getParticipants().stream().filter(RoomParticipant::getIsOnline).toList().size())
                .lastActivity(room.getLastActivityAt() != null ? room.getLastActivityAt().toString() : null)
                .build();

        return RoomDetailsResponse.builder()
                .room(RoomMapper.mapToRoomResponse(room))
                .participants(participants)
                .files(files)
                .stats(stats)
                .build();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "publicRooms", key = "'page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize", unless = "#result == null || #result.isEmpty()")
    public Page<RoomResponse> getPublicRooms(Pageable pageable) {
        return roomRepository.findPublicRooms(RoomVisibility.PUBLIC, RoomStatus.ACTIVE, pageable).map(RoomMapper::mapToPublicRoomResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "privateRooms", key = "'page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize", unless = "#result == null || #result.isEmpty()")
    public Page<RoomResponse> getPrivateRooms(Pageable pageable) {
        return roomRepository.findPrivateRooms(RoomVisibility.PRIVATE, RoomStatus.ACTIVE,pageable).map(RoomMapper::mapToPrivateRoomResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "publicRooms", key = "'search_' + #search + '_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize", unless = "#result == null || #result.isEmpty()")
    public Page<RoomResponse> searchPublicRooms(String search, Pageable pageable) {
        return roomRepository.searchPublicRooms(RoomVisibility.PUBLIC, RoomStatus.ACTIVE, search, pageable)
                .map(RoomMapper::mapToPublicRoomResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "privateRooms", key = "'search_' + #search + '_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize", unless = "#result == null || #result.isEmpty()")
    public Page<RoomResponse> searchPrivateRooms(String search, Pageable pageable) {
        return roomRepository.searchPrivateRooms(RoomVisibility.PRIVATE, RoomStatus.ACTIVE, search, pageable)
                .map(RoomMapper::mapToPrivateRoomResponse);
    }

    @Transactional
    @CacheEvict(value = {"roomDetails", "roomParticipants", "publicRooms", "rooms", "privateRooms"}, key = "#roomId")
    public void leaveRoom(Long roomId, String userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("room not found"));

        RoomParticipant participant = participantRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("participant not found"));

        participant.setLeftAt(LocalDateTime.now());
        participant.setIsOnline(false);

        room.removeParticipant(participant);
        room.updateActivity();

        roomRepository.save(room);

        RoomDetailsResponse updatedRoom = getRoomDetails(roomId);
        webSocketHandler.broadcastRoomUpdate(room.getRoomCode(), updatedRoom);
        webSocketHandler.broadcastPublicRoomsUpdate();
    }

    @Transactional
    @CacheEvict(value = {"rooms", "roomDetails", "roomParticipants", "publicRooms", "roomFiles", "privateRooms"}, key = "#roomId")
    public void deleteRoom(Long roomId, String userId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("room not found"));

        room.setStatus(RoomStatus.DELETED);
        roomRepository.save(room);
        webSocketHandler.broadcastPublicRoomsUpdate();
        List<RoomResponse> featuredRooms = getFeaturedRoomsForUser(userId);
        webSocketHandler.broadcastFeaturedRoomsToUser(userId, featuredRooms);
    }


    @Transactional
    @Scheduled(cron = "0 0/5 * * * ?")
    @CacheEvict(value = {"rooms", "roomDetails", "publicRooms", "roomParticipants", "roomFiles", "privateRooms"}, allEntries = true)
    public void expireExpiredRooms() {
        LocalDateTime now = LocalDateTime.now();
        List<Room> expiredRooms = roomRepository.findExpiredRooms(now,RoomStatus.ACTIVE);

        for(Room room : expiredRooms) {
            LoggerUtil.audit("auto-expiring room=" + room.getRoomCode() + " (expired at " + room.getExpiresAt() + ")");

            room.setStatus(RoomStatus.EXPIRED);
            room.getFiles().forEach(file -> {
                try {
                    cloudflareR2Service.deleteFile(file.getCloudFlareKey());
                }catch (Exception ex){
                    LoggerUtil.warn(RoomService.class,"failed to delete file=" + file.getCloudFlareKey() + "," + ex.getMessage());
                }
            });

            room.getFiles().clear();
            room.getParticipants().clear();

            roomRepository.save(room);
        }

        if(!expiredRooms.isEmpty()) {
            LoggerUtil.audit("expired " + expiredRooms.size() + ",rooms in batch");
        }
    }
    @Cacheable(value = "publicRooms", key = "'advanced_' + #query + '_' + #minParticipants + '_' + #maxParticipants + '_' + #minFiles + '_' + #hasSpace + '_' + #sortBy + '_page_' + #pageable.pageNumber + '_size_' + #pageable.pageSize", unless = "#result == null || #result.isEmpty()")
    public Page<RoomResponse> searchRoomsAdvanced(String query, Integer minParticipants, Integer maxParticipants, Integer minFiles, Boolean hasSpace, String sortBy, Pageable pageable) {

        Page<RoomProjection> projections = roomRepository.searchRoomsAdvanced(
                query, minParticipants, maxParticipants,
                minFiles, hasSpace, sortBy, pageable
        );

        return projections.map(RoomMapper::mapToRoomResponse);
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> getFeaturedRoomsForUser(String userId) {
        List<Room> rooms = roomRepository.findFeaturedRoomsByUserId(userId, RoomStatus.ACTIVE);
        return rooms.stream()
                .map(RoomMapper::mapToRoomResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void toggleRoomFeatured(Long roomId, String userId, Boolean isFeatured) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        room.setIsFeatured(isFeatured);
        roomRepository.save(room);
        cacheService.evictRoomCaches(roomId);
        List<RoomResponse> featuredRooms = getFeaturedRoomsForUser(userId);
        webSocketHandler.broadcastFeaturedRoomsToUser(userId, featuredRooms);
        webSocketHandler.broadcastPublicRoomsUpdate();
    }

    @Transactional
    @CacheEvict(value = {"publicRooms","rooms","privateRooms"}, allEntries = true)
    public RoomResponse patchRoomDetails(String userId, Long roomId, RoomUpdateRequest request) {
            Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("room not found"));
            if(!room.getCreatorUserId().equals(userId)){
                throw new RuntimeException("only room owner can change room details");
            }

            if(request.getRoomName() == null || request.getRoomName().isEmpty()){
                throw new RuntimeException("not a valid room name");
            }
            room.setRoomName(request.getRoomName());
            room.setIsFeatured(request.getIsFeatured());

            Room savedRoom = roomRepository.save(room);
            cacheService.updateRoomInCache(room.getId(),RoomMapper.mapToRoomResponse(room));
            RoomResponse response = RoomMapper.mapToRoomResponse(savedRoom);
            if(savedRoom.getRoomVisibility().equals(RoomVisibility.PUBLIC)){
                webSocketHandler.broadcastPublicRoomsUpdate();
            }
            List<RoomResponse> featuredRooms = getFeaturedRoomsForUser(userId);
            webSocketHandler.broadcastFeaturedRoomsToUser(userId, featuredRooms);
            return response;
    }
}
