package com.quickshare.backend.service.room;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class CloudflareR2Service {
    @Value("${r2.account-id}")
    private String accountId;

    @Value("${r2.access-key-id}")
    private String accessKeyId;

    @Value("${r2.secret-access-key}")
    private String secretAccessKey;

    @Value("${r2.bucket-name}")
    private String bucketName;

    @Value("${r2.endpoint}")
    private String endPoint;

    private S3Client s3Client;
    private S3Presigner s3Presigner;

    @PostConstruct
    public void init() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId,secretAccessKey);

        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endPoint))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1)
                .build();

        this.s3Presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endPoint))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .region(Region.US_EAST_1)
                .build();
    }

    @PreDestroy
    public void cleanUp() {
        if(s3Client != null) {
            s3Client.close();
        }
        if(s3Presigner != null) {
            s3Presigner.close();
        }
    }

    /**
     * generate presigned url for uploading a file
     * valid for 1 hour
     */
    public String generatePresignedUploadUrl(String key, String contentType) {
        try {
            String decoded = URLDecoder.decode(key, StandardCharsets.UTF_8);
            if (decoded.contains("..") || decoded.contains("/") || decoded.contains("\\")) {
                throw new IllegalArgumentException("Invalid file key");
            }

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1))
                    .putObjectRequest(putObjectRequest)
                    .build();

            return s3Presigner.presignPutObject(presignRequest).url().toString();
        }catch (Exception e) {
            throw new RuntimeException("failed to generate upload URL: " + e.getMessage(), e);
        }
    }

    /**
     * generate presigned url for download a file
     */
    public String generatePresignedDownloadUrl(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofHours(1))
                    .getObjectRequest(getObjectRequest)
                    .build();

            return s3Presigner.presignGetObject(presignRequest).url().toString();
        }catch (Exception e) {
            throw new RuntimeException("failed to generate download URL: " + e.getMessage(),e);
        }
    }

    /**
     * delete a file from r2
     */
    public void deleteFile(String key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3Client.deleteObject(deleteRequest);
        }catch (Exception e) {
            throw new RuntimeException("failed to delete file: " + e.getMessage(),e);
        }
    }

    /**
     * get public URL for a file (if you have a custom domain configured)
     * for R2, you can configure a public domain in Cloudflare dashboard
     */
    public String getPublicUrl(String key) {
        return String.format("https://%s.%s.r2.cloudflarestorage.com/%s", bucketName, accountId, key);
    }

    /**
     * check if file exists in R2
     */
    public boolean fileExists(String key) {
        try {

            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.headObject(headRequest);
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Failed to check file existence: " + e.getMessage(), e);
        }
    }

    /**
     * get file size in bytes
     */
    public Long getFileSize(String key) {
        try {
            HeadObjectRequest headRequest = HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            HeadObjectResponse response = s3Client.headObject(headRequest);
            return response.contentLength();
        } catch (NoSuchKeyException e) {
            throw new RuntimeException("File not found: " + key);
        } catch (Exception e) {
            throw new RuntimeException("Failed to get file size: " + e.getMessage(), e);
        }
    }
    public int cleanupIncompleteUploads() {
        try {
            ListMultipartUploadsRequest listRequest = ListMultipartUploadsRequest.builder()
                    .bucket(bucketName)
                    .build();

            ListMultipartUploadsResponse response = s3Client.listMultipartUploads(listRequest);

            int count = 0;
            for (MultipartUpload upload : response.uploads()) {
                AbortMultipartUploadRequest abortRequest = AbortMultipartUploadRequest.builder()
                        .bucket(bucketName)
                        .key(upload.key())
                        .uploadId(upload.uploadId())
                        .build();

                s3Client.abortMultipartUpload(abortRequest);
                count++;
            }
            return count;
        } catch (Exception e) {
            throw new RuntimeException("Failed to cleanup incomplete uploads: " + e.getMessage(), e);
        }
    }
}
