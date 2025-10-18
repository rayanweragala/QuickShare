package com.quickshare.backend.service.room;

import com.quickshare.backend.dto.room.FileInfo;
import com.quickshare.backend.dto.room.ParticipantInfo;
import com.quickshare.backend.dto.room.RoomDetailsResponse;
import com.quickshare.backend.dto.room.RoomStats;
import com.quickshare.backend.entity.Room;
import com.quickshare.backend.entity.RoomParticipant;
import com.quickshare.backend.mapper.RoomMapper;
import com.quickshare.backend.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoomCacheService {
    private final RoomRepository roomRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "roomDetails", key = "#roomId", unless = "#result == null")
    public RoomDetailsResponse getRoomDetails(Long roomId) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("room not found"));

        List<ParticipantInfo> participants = room.getParticipants().stream()
                .map(RoomMapper::mapToParticipantInfo).collect(Collectors.toList());

        List<FileInfo> files = room.getFiles().stream()
                .map(RoomMapper::mapToFileInfo).collect(Collectors.toList());

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
}