package com.quickshare.backend.repository;

import com.quickshare.backend.entity.RoomFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomFileRepository extends JpaRepository<RoomFile, Long> {
    Optional<RoomFile> findByFileId(String fileId);
    List<RoomFile> findByRoomIdOrderByUploadedAtDesc(Long roomId);
}