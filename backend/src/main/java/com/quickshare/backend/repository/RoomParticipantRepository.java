package com.quickshare.backend.repository;

import com.quickshare.backend.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {
    Optional<RoomParticipant> findByRoomIdAndSocketId(@Param("roomId") Long roomId,
                                                      @Param("socketId") String socketId);
    @Query("SELECT p FROM RoomParticipant p WHERE p.room.id = :roomId AND p.isOnline = true")
    List<RoomParticipant> findActiveParticipants(@Param("roomId") Long roomId);
    @Query("SELECT p FROM RoomParticipant p WHERE p.room.id = :roomId")
    List<RoomParticipant> findByRoomId(@Param("roomId") Long roomId);
    @Query("SELECT COUNT(p) FROM RoomParticipant p WHERE p.room.id = :roomId AND p.isOnline = true")
    Integer countActiveParticipants(@Param("roomId") Long roomId);
}