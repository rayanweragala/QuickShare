package com.quickshare.backend.dto.room;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for uploading a file to a room")
public class UploadFileRequest {

    @Schema(description = "Code of the room where the file is being uploaded")
    private String roomCode;

    @Schema(description = "Original name of the uploaded file")
    private String fileName;

    @Schema(description = "MIME type of the uploaded file")
    private String fileType;

    @Schema(description = "Size of the uploaded file in bytes")
    private Long fileSize;

    @Schema(description = "SHA-256 or MD5 checksum for file integrity verification")
    private String checksum;
}
