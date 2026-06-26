package com.amrutha.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.io.File;

@Component
public class UploadsDirDiskSpaceHealthIndicator implements HealthIndicator {

    @Override
    public Health health() {
        File path = new File(System.getProperty("user.dir"), "uploads");
        if (!path.exists()) {
            path.mkdirs();
        }
        long freeSpace = path.getFreeSpace(); // in bytes
        long totalSpace = path.getTotalSpace(); // in bytes
        
        long thresholdBytes = 10L * 1024 * 1024; // 10 MB threshold for warnings
        
        if (freeSpace > thresholdBytes) {
            return Health.up()
                    .withDetail("path", path.getAbsolutePath())
                    .withDetail("freeSpaceBytes", freeSpace)
                    .withDetail("freeSpaceGb", String.format("%.2f GB", (double) freeSpace / (1024 * 1024 * 1024)))
                    .withDetail("totalSpaceGb", String.format("%.2f GB", (double) totalSpace / (1024 * 1024 * 1024)))
                    .build();
        } else {
            return Health.down()
                    .withDetail("path", path.getAbsolutePath())
                    .withDetail("error", "Free disk space below threshold (10MB)")
                    .withDetail("freeSpaceBytes", freeSpace)
                    .build();
        }
    }
}
