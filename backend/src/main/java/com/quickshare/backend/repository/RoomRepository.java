package com.quickshare.backend.repository;

import com.quickshare.backend.entity.Room;
import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByRoomCode(String roomCode);

    Optional<Room> findByIdAndStatus(Long id, RoomStatus status);

    @Query("SELECT r FROM Room r WHERE r.roomVisibility = :visibility AND r.status = :status ORDER BY r.lastActivityAt DESC")
    Page<Room> findPublicRooms(@Param("visibility") RoomVisibility visibility,
                               @Param("status") RoomStatus status,
                               Pageable pageable);

    @Query("SELECT r FROM Room r WHERE r.roomVisibility = :visibility AND r.status = :status AND r.roomName ILIKE %:search% ORDER BY r.lastActivityAt DESC")
    Page<Room> searchPublicRooms(@Param("visibility") RoomVisibility visibility,
                                 @Param("status") RoomStatus status,
                                 @Param("search") String search,
                                 Pageable pageable);

    @Query("SELECT r FROM Room r WHERE r.creatorIp = :creatorIp AND r.status = :status")
    List<Room> findCreatorRooms(@Param("creatorIp") String creatorIp,
                                @Param("status") RoomStatus status);

    @Query("SELECT r FROM Room r WHERE r.expiresAt IS NOT NULL AND r.expiresAt < :now AND r.status = :status")
    List<Room> findExpiredRooms(@Param("now") LocalDateTime now,
                                @Param("status") RoomStatus status);

    @Query("SELECT r FROM Room r WHERE r.lastActivityAt IS NOT NULL AND r.lastActivityAt < :inactiveThreshold AND r.status = :status")
    List<Room> findInactiveRooms(@Param("inactiveThreshold") LocalDateTime inactiveThreshold,
                                 @Param("status") RoomStatus status);

    @Query("SELECT COUNT(r) FROM Room r WHERE r.status = :status")
    Long countByStatus(@Param("status") RoomStatus status);
}