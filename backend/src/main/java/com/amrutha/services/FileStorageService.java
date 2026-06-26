package com.amrutha.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FileStorageService {
    private static final Logger logger = LoggerFactory.getLogger(FileStorageService.class);

    private final Cloudinary cloudinary;
    private final Path localUploadPath;
    
    // In-memory cache for duplicate file detection mapping SHA-256 hash -> image URL
    private final Map<String, String> hashToUrlMap = new ConcurrentHashMap<>();

    public FileStorageService(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.api-key}") String apiKey,
            @Value("${app.cloudinary.api-secret}") String apiSecret) {

        // Setup local storage path as fallback
        this.localUploadPath = Paths.get(System.getProperty("user.dir"), "uploads").toAbsolutePath();
        try {
            Files.createDirectories(this.localUploadPath);
        } catch (IOException e) {
            logger.error("Could not create local upload directory: {}", e.getMessage());
        }

        // Initialize Cloudinary only if credentials are changed from defaults
        if (cloudName != null && !cloudName.equals("demo-cloud") && !cloudName.trim().isEmpty()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            logger.info("Cloudinary service initialized successfully.");
        } else {
            this.cloudinary = null;
            logger.info("Cloudinary credentials not provided. Falling back to local storage.");
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file.");
        }

        // 1. File Type Validation
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Invalid file type. Only image files are allowed.");
        }

        // 2. File Size Validation (Max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size exceeds the maximum limit of 5MB.");
        }

        try {
            byte[] fileBytes = file.getBytes();
            
            // 3. Duplicate Upload Prevention via SHA-256 Hash checking
            String fileHash = calculateSha256(fileBytes);
            if (hashToUrlMap.containsKey(fileHash)) {
                logger.info("Duplicate file upload detected. Returning existing URL.");
                return hashToUrlMap.get(fileHash);
            }

            // 4. Image Compression & Optional Thumbnail Generation
            byte[] processedBytes = compressImage(fileBytes, contentType);

            // 5. Try Cloudinary if available
            String savedUrl = null;
            if (cloudinary != null) {
                try {
                    Map<?, ?> uploadResult = cloudinary.uploader().upload(processedBytes, ObjectUtils.asMap(
                            "folder", "amrutha_chicken"
                    ));
                    savedUrl = (String) uploadResult.get("secure_url");
                } catch (IOException e) {
                    logger.error("Cloudinary upload failed, falling back to local: {}", e.getMessage());
                }
            }

            // 6. Fallback to Local Storage
            if (savedUrl == null) {
                String originalFileName = file.getOriginalFilename();
                String fileExtension = ".jpg";
                if (originalFileName != null && originalFileName.contains(".")) {
                    fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
                }
                String uniqueFileName = UUID.randomUUID().toString() + fileExtension;

                Path targetLocation = this.localUploadPath.resolve(uniqueFileName);
                Files.copy(new ByteArrayInputStream(processedBytes), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                // Check and save thumbnail in the local uploads directory
                byte[] thumbnailBytes = generateThumbnail(fileBytes, contentType);
                if (thumbnailBytes != fileBytes) {
                    Path thumbLocation = this.localUploadPath.resolve("thumb_" + uniqueFileName);
                    Files.copy(new ByteArrayInputStream(thumbnailBytes), thumbLocation, StandardCopyOption.REPLACE_EXISTING);
                }

                // Return relative API path that we'll expose via static resource handler
                savedUrl = "/api/public/uploads/" + uniqueFileName;
            }

            // Cache the url mapping
            hashToUrlMap.put(fileHash, savedUrl);
            return savedUrl;

        } catch (IOException ex) {
            throw new RuntimeException("Failed to process or store file. Please try again!", ex);
        }
    }

    private String calculateSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Could not calculate file hash", e);
        }
    }

    private byte[] generateThumbnail(byte[] originalBytes, String contentType) throws IOException {
        ByteArrayInputStream in = new ByteArrayInputStream(originalBytes);
        BufferedImage originalImage = ImageIO.read(in);
        if (originalImage == null) {
            return originalBytes; 
        }

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        int targetSize = 200;

        // Keep aspect ratio
        int newWidth = targetSize;
        int newHeight = targetSize;
        if (width > height) {
            newHeight = (int) (((double) height / width) * targetSize);
        } else {
            newWidth = (int) (((double) width / height) * targetSize);
        }

        BufferedImage thumbnailImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = thumbnailImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        String formatName = contentType.contains("png") ? "png" : "jpeg";
        ImageIO.write(thumbnailImage, formatName, out);
        return out.toByteArray();
    }

    private byte[] compressImage(byte[] originalBytes, String contentType) throws IOException {
        if (contentType.contains("png")) {
            return originalBytes; 
        }
        ByteArrayInputStream in = new ByteArrayInputStream(originalBytes);
        BufferedImage originalImage = ImageIO.read(in);
        if (originalImage == null) {
            return originalBytes;
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            return originalBytes;
        }

        ImageWriter writer = writers.next();
        ImageOutputStream ios = ImageIO.createImageOutputStream(out);
        writer.setOutput(ios);

        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(0.75f); // 75% quality jpeg compression
        }

        writer.write(null, new javax.imageio.IIOImage(originalImage, null, null), param);
        writer.dispose();
        ios.close();

        return out.toByteArray();
    }

    public Path getLocalUploadPath() {
        return this.localUploadPath;
    }
}
