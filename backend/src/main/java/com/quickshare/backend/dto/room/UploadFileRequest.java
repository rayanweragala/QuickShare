package com.quickshare.backend.dto.room;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request payload for uploading a file to a room")
public class UploadFileRequest {

    @Schema(description = "Code of the room where the file is being uploaded")
    private String roomCode;

    @Schema(description = "Original name of the uploaded file")
    @NotBlank(message = "fileName is required")
    @Size(max = 255, message = "fileName must be at most 255 characters")
    private String fileName;

    @Schema(description = "MIME type of the uploaded file")
    @NotBlank(message = "fileType is required")
    @Pattern(regexp = "^(image|video|audio|application|text)/[a-zA-Z0-9.+-]+$", message = "invalid fileType")
    private String fileType;

    @Schema(description = "Size of the uploaded file in bytes")
    @NotNull(message = "fileSize is required")
    @Min(value = 1, message = "fileSize must be at least 1")
    @Max(value = 5368709120L, message = "fileSize exceeds allowed limit")
    private Long fileSize;

    @Schema(description = "SHA-256 or MD5 checksum for file integrity verification")
    private String checksum;
}
