package com.amrutha.services;

import com.amrutha.models.Gallery;
import com.amrutha.models.Offer;
import com.amrutha.models.ProductImage;
import com.amrutha.models.Review;
import com.amrutha.repositories.GalleryRepository;
import com.amrutha.repositories.OfferRepository;
import com.amrutha.repositories.ProductImageRepository;
import com.amrutha.repositories.ReviewRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class CleanupScheduler {
    private static final Logger logger = LoggerFactory.getLogger(CleanupScheduler.class);

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private GalleryRepository galleryRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private FileStorageService fileStorageService;

    // Runs once a week on Sunday at 3 AM
    @Scheduled(cron = "0 0 3 * * SUN")
    public void cleanupOrphanedFiles() {
        logger.info("Starting scheduled cleanup of orphaned files in uploads directory.");
        try {
            Path uploadPath = fileStorageService.getLocalUploadPath();
            File uploadDir = uploadPath.toFile();
            if (!uploadDir.exists() || !uploadDir.isDirectory()) {
                logger.warn("Uploads directory does not exist or is not a directory. Skipping cleanup.");
                return;
            }

            File[] files = uploadDir.listFiles();
            if (files == null || files.length == 0) {
                logger.info("No files found in uploads directory. Nothing to clean.");
                return;
            }

            // 1. Gather all active filenames from database
            Set<String> activeFiles = new HashSet<>();

            List<ProductImage> productImages = productImageRepository.findAll();
            for (ProductImage img : productImages) {
                extractFilename(img.getImageUrl(), activeFiles);
            }

            List<Review> reviews = reviewRepository.findAll();
            for (Review rev : reviews) {
                extractFilename(rev.getPhotoUrl(), activeFiles);
            }

            List<Gallery> galleries = galleryRepository.findAll();
            for (Gallery gal : galleries) {
                extractFilename(gal.getImageUrl(), activeFiles);
            }

            List<Offer> offers = offerRepository.findAll();
            for (Offer off : offers) {
                extractFilename(off.getBannerUrl(), activeFiles);
            }

            // 2. Scan and delete unreferenced files
            int deleteCount = 0;
            for (File file : files) {
                String name = file.getName();
                
                // Keep subdirectories or special files
                if (file.isDirectory() || name.startsWith(".")) {
                    continue;
                }

                // If it's a thumbnail (starts with thumb_), check the base filename
                String checkName = name;
                if (name.startsWith("thumb_")) {
                    checkName = name.substring(6);
                }

                if (!activeFiles.contains(checkName)) {
                    boolean deleted = file.delete();
                    if (deleted) {
                        deleteCount++;
                        logger.debug("Deleted orphaned upload file: {}", name);
                    } else {
                        logger.error("Failed to delete orphaned upload file: {}", name);
                    }
                }
            }

            logger.info("Cleanup completed. Deleted {} orphaned files.", deleteCount);

        } catch (Exception e) {
            logger.error("Error occurred during scheduled cleanup: ", e);
        }
    }

    private void extractFilename(String url, Set<String> activeFiles) {
        if (url == null || url.trim().isEmpty()) {
            return;
        }

        // We only clean files that are in our local upload format: /api/public/uploads/filename.ext
        if (url.contains("/api/public/uploads/")) {
            String filename = url.substring(url.lastIndexOf("/") + 1);
            if (!filename.trim().isEmpty()) {
                activeFiles.add(filename);
            }
        }
    }
}
