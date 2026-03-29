package com.quickshare.backend.repository;

import com.quickshare.backend.entity.Room;
import com.quickshare.backend.model.enums.RoomStatus;
import com.quickshare.backend.model.enums.RoomVisibility;
import com.quickshare.backend.model.room.RoomProjection;
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

    @Query(
            value = "SELECT DISTINCT r FROM Room r " +
                    "LEFT JOIN FETCH r.participants " +
                    "LEFT JOIN FETCH r.files " +
                    "WHERE r.roomVisibility = :visibility AND r.status = :status ORDER BY r.lastActivityAt DESC",
            countQuery = "SELECT COUNT(r) FROM Room r WHERE r.roomVisibility = :visibility AND r.status = :status"
    )
    Page<Room> findPublicRooms(@Param("visibility") RoomVisibility visibility,
                               @Param("status") RoomStatus status,
                               Pageable pageable);

    @Query(
            value = "SELECT DISTINCT r FROM Room r " +
                    "LEFT JOIN FETCH r.participants " +
                    "LEFT JOIN FETCH r.files " +
                    "WHERE r.roomVisibility = :visibility AND r.status = :status ORDER BY r.lastActivityAt DESC",
            countQuery = "SELECT COUNT(r) FROM Room r WHERE r.roomVisibility = :visibility AND r.status = :status"
    )
    Page<Room> findPrivateRooms(@Param("visibility") RoomVisibility visibility,
                               @Param("status") RoomStatus status,
                               Pageable pageable);

    @Query("SELECT r FROM Room r WHERE r.roomVisibility = :visibility AND r.status = :status AND r.roomName ILIKE %:search% ORDER BY r.lastActivityAt DESC")
    Page<Room> searchPublicRooms(@Param("visibility") RoomVisibility visibility,
                                 @Param("status") RoomStatus status,
                                 @Param("search") String search,
                                 Pageable pageable);

    @Query("SELECT r FROM Room r " + "WHERE r.roomVisibility = :visibility " + "AND r.status = :status " + "AND (LOWER(r.roomName) LIKE LOWER(CONCAT('%', :search, '%')) " + "OR LOWER(r.roomCode) LIKE LOWER(CONCAT('%', :search, '%'))) " + "ORDER BY r.lastActivityAt DESC")
    Page<Room> searchPrivateRooms(@Param("visibility") RoomVisibility visibility,
                                 @Param("status") RoomStatus status,
                                 @Param("search") String search,
                                 Pageable pageable);
    @Query("SELECT r FROM Room r WHERE r.expiresAt IS NOT NULL AND r.expiresAt < :now AND r.status = :status")
    List<Room> findExpiredRooms(@Param("now") LocalDateTime now,
                                @Param("status") RoomStatus status);

    @Query(value = """
    SELECT\s
        r.room_id AS id,
        r.room_code AS roomCode,
        r.room_name AS roomName,
        r.room_icon AS roomIcon,
        r.creator_animal_name AS creatorAnimalName,
        r.room_visibility AS roomVisibility,
        r.room_status AS status,
        r.max_participants AS maxParticipants,
        r.created_at AS createdAt,
        r.expires_at AS expiresAt,
        r.total_visitors AS totalVisitors,
        COALESCE(COUNT(DISTINCT p.ROOM_PARTICIPANT_ID), 0) AS participantCount,
        COALESCE(COUNT(DISTINCT f.file_id), 0) AS fileCount,
        COALESCE(SUM(f.download_count), 0) AS totalDownloads
    FROM rooms r
    LEFT JOIN room_participants p ON r.room_id = p.room_id
    LEFT JOIN room_files f ON r.room_id = f.room_id
    WHERE r.room_visibility = 'PUBLIC'
      AND r.room_status = 'ACTIVE'
      AND (:query IS NULL OR LOWER(r.room_name) LIKE LOWER(CONCAT('%', :query, '%'))\s
                           OR LOWER(r.creator_animal_name) LIKE LOWER(CONCAT('%', :query, '%')))
      AND (:minParticipants IS NULL OR (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) >= :minParticipants)
      AND (:maxParticipants IS NULL OR (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) <= :maxParticipants)
      AND (:minFiles IS NULL OR (SELECT COUNT(*) FROM room_files WHERE room_id = r.room_id) >= :minFiles)
      AND (:hasSpace IS NULL OR :hasSpace = FALSE OR\s
           (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) < r.max_participants)
    GROUP BY r.room_id
    ORDER BY\s
        CASE WHEN :sortBy = 'popular' THEN r.total_visitors END DESC NULLS LAST,
        CASE WHEN :sortBy = 'mostFiles' THEN COALESCE(COUNT(DISTINCT f.file_id), 0) END DESC NULLS LAST,
        CASE WHEN :sortBy = 'leastCrowded' THEN COALESCE(COUNT(DISTINCT p.ROOM_PARTICIPANT_ID), 0) END ASC NULLS LAST,
        CASE WHEN :sortBy = 'recent' OR :sortBy IS NULL THEN r.created_at END DESC NULLS LAST
   \s""",
            countQuery = """
    SELECT COUNT(DISTINCT r.room_id)
    FROM rooms r
    WHERE r.room_visibility = 'PUBLIC'
      AND r.room_status = 'ACTIVE'
      AND (:query IS NULL OR LOWER(r.room_name) LIKE LOWER(CONCAT('%', :query, '%'))\s
                           OR LOWER(r.creator_animal_name) LIKE LOWER(CONCAT('%', :query, '%')))
      AND (:minParticipants IS NULL OR (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) >= :minParticipants)
      AND (:maxParticipants IS NULL OR (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) <= :maxParticipants)
      AND (:minFiles IS NULL OR (SELECT COUNT(*) FROM room_files WHERE room_id = r.room_id) >= :minFiles)
      AND (:hasSpace IS NULL OR :hasSpace = FALSE OR\s
           (SELECT COUNT(*) FROM room_participants WHERE room_id = r.room_id) < r.max_participants)
   \s""",
            nativeQuery = true)
    Page<RoomProjection> searchRoomsAdvanced(
            @Param("query") String query,
            @Param("minParticipants") Integer minParticipants,
            @Param("maxParticipants") Integer maxParticipants,
            @Param("minFiles") Integer minFiles,
            @Param("hasSpace") Boolean hasSpace,
            @Param("sortBy") String sortBy,
            Pageable pageable
    );
    @Query("SELECT r FROM Room r WHERE r.creatorUserId = :userId AND r.isFeatured = true AND r.status = :status  ORDER BY r.createdAt DESC")
    List<Room> findFeaturedRoomsByUserId(@Param("userId") String userId, @Param("status") RoomStatus status);
}
