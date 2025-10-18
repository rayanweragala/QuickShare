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
@Schema(description = "Response returned after initializing a file upload")
public class FileUploadResponse {

    @Schema(description = "Unique ID assigned to the uploaded file")
    private String fileId;

    @Schema(description = "Name of the uploaded file")
    private String fileName;

    @Schema(description = "Pre-signed URL to which the file should be uploaded")
    private String uploadUrl;

    @Schema(description = "Optional message indicating upload instructions or status")
    private String message;
}
