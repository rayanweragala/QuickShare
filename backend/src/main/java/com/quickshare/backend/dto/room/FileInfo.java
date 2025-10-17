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
@Schema(description = "Metadata and status information about an uploaded file")
public class FileInfo {

    @Schema(description = "Unique ID of the file")
    private String fileId;

    @Schema(description = "Original file name")
    private String fileName;

    @Schema(description = "MIME type of the file (e.g., image/png, application/pdf)")
    private String fileType;

    @Schema(description = "File size in bytes")
    private Long fileSize;

    @Schema(description = "Animal name of the user who uploaded the file")
    private String uploaderAnimalName;

    @Schema(description = "Uploader user ID")
    private String uploaderUserId;

    @Schema(description = "Upload timestamp in ISO 8601 format")
    private String uploadedAt;

    @Schema(description = "Number of times this file has been downloaded")
    private Long downloadCount;

    @Schema(description = "Direct URL for downloading the file")
    private String downloadUrl;

    @Schema(description = "Indicates whether the file is still available for download")
    private Boolean isAvailable;
}
