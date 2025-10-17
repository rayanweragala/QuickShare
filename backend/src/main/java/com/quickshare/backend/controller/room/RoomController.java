package com.quickshare.backend.controller.room;

import com.quickshare.backend.dto.room.*;
import com.quickshare.backend.service.room.RoomService;
import com.quickshare.backend.util.LoggerUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
@Tag(name = "Room Management", description = "APIs for room creation, joining, and management")
@SecurityRequirement(name = "Bearer Authentication")
public class RoomController {
    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<RoomResponse> createRoom(
            @Valid @RequestBody CreateRoomRequest request,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }

        String ipAddress = httpRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = httpRequest.getRemoteAddr();
        }

        LoggerUtil.audit("room creation request for user=" + userId + ",ipAddress=" + ipAddress);

        RoomResponse response = roomService.createRoom(request, userId, ipAddress);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{roomCode}/join")
    @Operation(summary = "Join an existing room", description = "Join a room using its unique code")
    public ResponseEntity<RoomDetailsResponse> joinRoom(
            @PathVariable String roomCode,
            @Valid @RequestBody JoinRoomRequest request,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }

        String ipAddress = httpRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = httpRequest.getRemoteAddr();
        }

        String socketId = request.getSocketId();

        LoggerUtil.audit("room join request for user=" + userId + ",ipAddress=" + ipAddress + ",socketId=" + socketId);

        RoomDetailsResponse response = roomService.joinRoom(roomCode, socketId, ipAddress, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Get room details", description = "Retrieve full details of a specific room")
    public ResponseEntity<RoomDetailsResponse> getRoomDetails(@PathVariable Long roomId) {
        RoomDetailsResponse response = roomService.getRoomDetails(roomId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/public")
    @Operation(summary = "List public rooms", description = "Get paginated list of public rooms")
    public ResponseEntity<Page<RoomResponse>> getPublicRooms(Pageable pageable) {
        Page<RoomResponse> publicRooms = roomService.getPublicRooms(pageable);
        return ResponseEntity.ok(publicRooms);
    }

    @GetMapping("/private")
    @Operation(summary = "List private rooms", description = "Get paginated list of private rooms")
    public ResponseEntity<Page<RoomResponse>> getPrivateRooms(Pageable pageable) {
        Page<RoomResponse> privateRooms = roomService.getPrivateRooms(pageable);
        return ResponseEntity.ok(privateRooms);
    }

    @GetMapping("/public/search")
    @Operation(summary = "Search public rooms", description = "Search public rooms by name")
    public ResponseEntity<Page<RoomResponse>> searchPublicRooms(
            @RequestParam String search,
            Pageable pageable) {
        Page<RoomResponse> publicRooms = roomService.searchPublicRooms(search, pageable);
        return ResponseEntity.ok(publicRooms);
    }

    @GetMapping("/private/search")
    @Operation(summary = "Search private rooms", description = "Search private rooms by name or room code")
    public ResponseEntity<Page<RoomResponse>> searchPrivateRooms(
            @RequestParam String search,
            Pageable pageable) {
        Page<RoomResponse> privateRooms = roomService.searchPrivateRooms(search,pageable);
        return ResponseEntity.ok(privateRooms);
    }

    @DeleteMapping("/{roomId}")
    @Operation(summary = "Delete a room", description = "Delete a room (creator only)")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable Long roomId,
            HttpServletRequest httpRequest) {
        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        roomService.deleteRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{roomId}/leave")
    @Operation(summary = "Leave a room", description = "Leave a room as a participant")
    public ResponseEntity<Void> leaveRoom(
            @PathVariable Long roomId,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }

        String socketId = (String) httpRequest.getAttribute("socketId");
        roomService.leaveRoom(roomId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/search/advanced")
    @Operation(summary = "Advanced search room", description = "Search room details by minimum participants, maximum participants,...")
    public Page<RoomResponse> searchRoomsAdvanced(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer minParticipants,
            @RequestParam(required = false) Integer maxParticipants,
            @RequestParam(required = false) Integer minFiles,
            @RequestParam(required = false) Boolean hasSpace,
            @RequestParam(defaultValue = "recent") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page,size);
        return roomService.searchRoomsAdvanced(query,minParticipants,maxParticipants,minFiles,hasSpace,sortBy,pageable);
    }

    @PatchMapping("/{roomId}")
    @Operation(summary = "Update room details", description = "Update room name or mark room as user featured")
    public ResponseEntity<RoomResponse> patchRoomDetails(
            @PathVariable Long roomId,
            @Valid @RequestBody RoomUpdateRequest request,
            HttpServletRequest httpRequest
    ) {
        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        RoomResponse response = roomService.patchRoomDetails(userId,roomId,request);
        return ResponseEntity.ok(response);
    }
}