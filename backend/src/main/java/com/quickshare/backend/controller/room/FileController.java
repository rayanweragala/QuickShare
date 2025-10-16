package com.quickshare.backend.controller.room;

import com.quickshare.backend.dto.room.FileInfo;
import com.quickshare.backend.dto.room.FileUploadResponse;
import com.quickshare.backend.dto.room.UploadFileRequest;
import com.quickshare.backend.service.room.FileUploadService;
import com.quickshare.backend.util.LoggerUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rooms/{roomCode}/files")
@RequiredArgsConstructor
@Tag(name = "File Management", description = "APIs for file upload and download in rooms")
public class FileController {

    private final FileUploadService fileUploadService;

    /**
     * PHASE 1: initiate file upload
     * returns a presigned URL for direct upload to Cloudflare R2
     */
    @PostMapping("/initiate")
    @Operation(
            summary = "Initiate file upload",
            description = "Get a presigned URL to upload file directly to Cloudflare R2. " +
                    "Frontend should then PUT the file to the returned uploadUrl."
    )
    public ResponseEntity<FileUploadResponse> initiateUpload(
            @PathVariable String roomCode,
            @Valid @RequestBody UploadFileRequest request,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        if (userId == null) {
            userId = "anonymous";
        }

        String socketId = httpRequest.getHeader("X-Socket-Id");

        String ipAddress = httpRequest.getHeader("X-Forwarded-For");
        if (ipAddress == null) {
            ipAddress = httpRequest.getRemoteAddr();
        }

        LoggerUtil.audit("file upload initiation: " + request.getFileName() +
                " by user: " + userId);

        FileUploadResponse response = fileUploadService.initiateFileUpload(
                roomCode, request, userId, socketId, ipAddress
        );

        return ResponseEntity.ok(response);
    }

    /**
     * PHASE 2: complete file upload
     * call this after successfully uploading to the presigned URL
     */
    @PostMapping("/{fileId}/complete")
    @Operation(
            summary = "Complete file upload",
            description = "Confirm that file was uploaded to R2 and make it available for download"
    )
    public ResponseEntity<FileInfo> completeUpload(
            @PathVariable String roomCode,
            @PathVariable String fileId,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        if (userId == null) {
            userId = "anonymous";
        }

        String socketId = httpRequest.getHeader("X-Socket-Id");

        LoggerUtil.audit("completing file upload: " + fileId);

        FileInfo fileInfo = fileUploadService.completeFileUpload(roomCode, fileId,userId);

        return ResponseEntity.ok(fileInfo);
    }

    /**
     * get all files in a room
     */
    @GetMapping
    @Operation(summary = "Get room files", description = "list all available files in the room")
    public ResponseEntity<List<FileInfo>> getRoomFiles(@PathVariable String roomCode) {

        List<FileInfo> files = fileUploadService.getRoomFiles(roomCode);

        return ResponseEntity.ok(files);
    }

    /**
     * get download URL for a file
     */
    @GetMapping("/{fileId}/download")
    @Operation(
            summary = "Get file download URL",
            description = "Get a presigned URL to download the file from Cloudflare R2"
    )
    public ResponseEntity<Map<String, String>> getDownloadUrl(
            @PathVariable String roomCode,
            @PathVariable String fileId) {

        String downloadUrl = fileUploadService.getDownloadUrl(roomCode, fileId);

        return ResponseEntity.ok(Map.of(
                "downloadUrl", downloadUrl,
                "expiresIn", "3600",
                "message", "download URL valid for 1 hour"
        ));
    }

    /**
     * delete a file
     */
    @DeleteMapping("/{fileId}")
    @Operation(
            summary = "Delete a file",
            description = "Delete a file from the room (uploader or creator only)"
    )
    public ResponseEntity<Map<String, String>> deleteFile(
            @PathVariable String roomCode,
            @PathVariable String fileId,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        if (userId == null) {
            userId = "anonymous";
        }

        String socketId = httpRequest.getHeader("X-Socket-Id");

        fileUploadService.deleteFile(roomCode, fileId, userId);

        return ResponseEntity.ok(Map.of("message", "file deleted successfully"));
    }

    /**
     * cancel an incomplete upload
     */
    @DeleteMapping("/{fileId}/cancel")
    @Operation(
            summary = "Cancel upload",
            description = "Cancel an incomplete file upload"
    )
    public ResponseEntity<Map<String, String>> cancelUpload(
            @PathVariable String roomCode,
            @PathVariable String fileId,
            HttpServletRequest httpRequest) {

        String userId = httpRequest.getHeader("X-User-ID");
        if (userId == null) {
            userId = httpRequest.getHeader("X-User-Session");
        }
        if (userId == null) {
            userId = "anonymous";
        }

        String socketId = httpRequest.getHeader("X-Socket-Id");

        fileUploadService.cancelUpload(fileId, userId);

        return ResponseEntity.ok(Map.of("message", "upload cancelled"));
    }
}