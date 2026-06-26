package com.amrutha.controllers;

import com.amrutha.dto.OrderDtos.OrderRequest;
import com.amrutha.models.*;
import com.amrutha.repositories.*;
import com.amrutha.services.FileStorageService;
import com.amrutha.services.OrderService;
import com.amrutha.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private DeliveryAreaRepository deliveryAreaRepository;

    @Autowired
    private OfferRepository offerRepository;

    @Autowired
    private GalleryRepository galleryRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private BulkOrderRepository bulkOrderRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CallbackRequestRepository callbackRequestRepository;

    @Autowired
    private NotificationService notificationService;

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getSettings() {
        List<Setting> settingsList = settingRepository.findAll();
        Map<String, String> settingsMap = new HashMap<>();
        for (Setting setting : settingsList) {
            settingsMap.put(setting.getKeyName(), setting.getValue());
        }
        return ResponseEntity.ok(settingsMap);
    }

    @GetMapping("/delivery-areas")
    public ResponseEntity<List<DeliveryArea>> getActiveDeliveryAreas() {
        return ResponseEntity.ok(deliveryAreaRepository.findAll().stream()
                .filter(area -> Boolean.TRUE.equals(area.getIsActive()))
                .toList());
    }

    @GetMapping("/offers")
    public ResponseEntity<List<Offer>> getActiveOffers() {
        return ResponseEntity.ok(offerRepository.findByIsActiveTrue());
    }

    @GetMapping("/gallery")
    public ResponseEntity<List<Gallery>> getActiveGalleryImages() {
        return ResponseEntity.ok(galleryRepository.findByIsActiveTrue());
    }

    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getActiveAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findByIsActiveTrue());
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getApprovedReviews() {
        return ResponseEntity.ok(reviewRepository.findByIsApprovedTrue());
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeGuestOrder(@RequestBody OrderRequest orderRequest) {
        try {
            Order order = orderService.placeOrder(orderRequest, null);
            return ResponseEntity.ok(order);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Order processing failed: " + e.getMessage());
        }
    }

    @GetMapping("/orders/track")
    public ResponseEntity<?> trackOrder(@RequestParam Long orderId, @RequestParam String phone) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found with ID: " + orderId);
        }

        Order order = orderOpt.get();
        String orderPhone = order.getUser() != null ? order.getUser().getPhone() : order.getGuestPhone();

        // Check phone match (remove any whitespace/formatting if needed)
        if (orderPhone == null || !orderPhone.replaceAll("\\s+", "").contains(phone.replaceAll("\\s+", ""))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access Denied: Phone number does not match this order.");
        }

        return ResponseEntity.ok(order);
    }

    @PostMapping("/bulk-orders")
    public ResponseEntity<?> createBulkOrder(@RequestBody BulkOrder bulkOrder) {
        try {
            BulkOrder saved = bulkOrderRepository.save(bulkOrder);
            try {
                notificationService.createNotification(null,
                    "New Catering/Bulk Inquiry from " + saved.getName() + " (" + saved.getPhone() + ")",
                    "NEW_ORDER");
            } catch (Exception ne) {
                // Ignore notification error
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Inquiry submission failed: " + e.getMessage());
        }
    }

    @PostMapping("/callbacks")
    public ResponseEntity<?> createCallback(@RequestBody CallbackRequest callbackRequest) {
        try {
            CallbackRequest saved = callbackRequestRepository.save(callbackRequest);
            try {
                notificationService.createNotification(null,
                    "New Callback request from " + saved.getName() + " (" + saved.getPhone() + ")",
                    "NEW_CALLBACK");
            } catch (Exception ne) {
                // Ignore notification error
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Callback submission failed: " + e.getMessage());
        }
    }

    @PostMapping("/upload-screenshot")
    public ResponseEntity<?> uploadScreenshot(@RequestParam("file") MultipartFile file) {
        try {
            String url = fileStorageService.storeFile(file);
            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Image upload failed: " + e.getMessage());
        }
    }
}
