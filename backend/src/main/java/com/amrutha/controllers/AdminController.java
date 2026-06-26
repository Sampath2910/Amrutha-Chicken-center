package com.amrutha.controllers;

import com.amrutha.models.*;
import com.amrutha.repositories.*;
import com.amrutha.security.UserDetailsImpl;
import com.amrutha.services.AuditLogService;
import com.amrutha.services.FileStorageService;
import com.amrutha.services.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

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
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private BulkOrderRepository bulkOrderRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CallbackRequestRepository callbackRequestRepository;

    @Autowired
    private NotificationService notificationService;

    // 1. DASHBOARD OVERVIEW METRICS
    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long todayOrdersCount = orderRepository.countByCreatedAtAfter(startOfToday);
        long totalCustomers = userRepository.count();

        // Calculate popular products
        List<Order> allOrders = orderRepository.findAll();
        Map<String, Long> popularProducts = allOrders.stream()
                .flatMap(o -> o.getOrderItems().stream())
                .collect(Collectors.groupingBy(OrderItem::getProductName, Collectors.counting()));

        // Calculate top delivery villages
        Map<String, Long> topVillages = allOrders.stream()
                .filter(o -> o.getDeliveryVillage() != null)
                .collect(Collectors.groupingBy(Order::getDeliveryVillage, Collectors.counting()));

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("todayOrdersCount", todayOrdersCount);
        stats.put("totalCustomers", totalCustomers);
        stats.put("popularProducts", popularProducts);
        stats.put("topVillages", topVillages);

        return ResponseEntity.ok(stats);
    }

    // 2. ORDER MANAGEMENT
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
        }

        Order order = orderOpt.get();
        String oldStatus = order.getStatus();
        order.setStatus(status.toUpperCase());
        Order updated = orderRepository.save(order);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_ORDER_STATUS", 
                "Order #" + id + " status changed from " + oldStatus + " to " + status.toUpperCase(),
                request.getRemoteAddr());

        // Notify customer
        if (order.getUser() != null) {
            try {
                notificationService.createNotification(order.getUser(), 
                    "Your order #" + id + " status was updated to: " + status.toUpperCase(), 
                    "ORDER_STATUS");
            } catch (Exception e) {
                // Ignore notification failure
            }
        }

        return ResponseEntity.ok(updated);
    }

    @PutMapping("/orders/{id}/payment")
    public ResponseEntity<?> updateOrderPaymentStatus(
            @PathVariable Long id,
            @RequestParam String paymentStatus,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Order not found");
        }

        Order order = orderOpt.get();
        String oldPaymentStatus = order.getPaymentStatus();
        order.setPaymentStatus(paymentStatus.toUpperCase());
        Order updated = orderRepository.save(order);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_ORDER_PAYMENT_STATUS", 
                "Order #" + id + " payment status changed from " + oldPaymentStatus + " to " + paymentStatus.toUpperCase(),
                request.getRemoteAddr());

        // Notify customer
        if (order.getUser() != null) {
            try {
                notificationService.createNotification(order.getUser(), 
                    "Your order #" + id + " payment status was updated to: " + paymentStatus.toUpperCase(), 
                    "ORDER_STATUS");
            } catch (Exception e) {
                // Ignore notification failure
            }
        }

        return ResponseEntity.ok(updated);
    }

    // 3. PRODUCT & PRICING MANAGEMENT
    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAdminProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(
            @RequestBody Product product,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Product saved = productRepository.save(product);
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "CREATE_PRODUCT", 
                "Created product: " + product.getName() + " with base price: " + product.getBasePrice(),
                request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(
            @PathVariable Long id,
            @RequestBody Product productDetails,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
        }

        Product product = productOpt.get();
        String oldPrice = product.getBasePrice() != null ? product.getBasePrice().toString() : "NULL";
        String oldStatus = product.getStatus();

        product.setName(productDetails.getName());
        product.setNameTelugu(productDetails.getNameTelugu());
        product.setDescription(productDetails.getDescription());
        product.setDescriptionTelugu(productDetails.getDescriptionTelugu());
        product.setBasePrice(productDetails.getBasePrice());
        product.setStatus(productDetails.getStatus().toUpperCase());
        product.setIsChicken(productDetails.getIsChicken());

        Product updated = productRepository.save(product);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_PRODUCT", 
                "Updated product " + product.getName() + " (Price: " + oldPrice + " -> " + product.getBasePrice() + ", Status: " + oldStatus + " -> " + product.getStatus() + ")",
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
        }

        Product product = productOpt.get();
        productRepository.delete(product);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "DELETE_PRODUCT", 
                "Deleted product " + product.getName(),
                request.getRemoteAddr());

        return ResponseEntity.ok("Product deleted successfully");
    }

    // 4. SETTINGS MANAGEMENT
    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(
            @RequestBody Map<String, String> settingsMap,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);

        for (Map.Entry<String, String> entry : settingsMap.entrySet()) {
            Setting setting = settingRepository.findById(entry.getKey())
                    .orElse(new Setting(entry.getKey(), "", "", LocalDateTime.now()));
            
            String oldVal = setting.getValue();
            setting.setValue(entry.getValue());
            settingRepository.save(setting);

            auditLogService.log(adminUser, "UPDATE_SETTING", 
                    "Setting " + entry.getKey() + " updated: '" + oldVal + "' -> '" + entry.getValue() + "'",
                    request.getRemoteAddr());
        }

        return ResponseEntity.ok("Settings updated successfully");
    }

    // 5. DELIVERY AREA MANAGEMENT
    @GetMapping("/delivery-areas")
    public ResponseEntity<List<DeliveryArea>> getAdminDeliveryAreas() {
        return ResponseEntity.ok(deliveryAreaRepository.findAll());
    }

    @PostMapping("/delivery-areas")
    public ResponseEntity<?> createDeliveryArea(
            @RequestBody DeliveryArea deliveryArea,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        DeliveryArea saved = deliveryAreaRepository.save(deliveryArea);
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "CREATE_DELIVERY_AREA", 
                "Created delivery area: " + deliveryArea.getVillageName() + " with fee: " + deliveryArea.getChargeAmount(),
                request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/delivery-areas/{id}")
    public ResponseEntity<?> updateDeliveryArea(
            @PathVariable Long id,
            @RequestBody DeliveryArea details,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<DeliveryArea> areaOpt = deliveryAreaRepository.findById(id);
        if (areaOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Delivery area not found");
        }

        DeliveryArea area = areaOpt.get();
        String oldCharge = area.getChargeAmount() != null ? area.getChargeAmount().toString() : "0.00";
        boolean oldState = area.getIsActive();

        area.setVillageName(details.getVillageName());
        area.setChargeAmount(details.getChargeAmount());
        area.setIsActive(details.getIsActive());

        DeliveryArea updated = deliveryAreaRepository.save(area);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_DELIVERY_AREA", 
                "Updated delivery area " + area.getVillageName() + " (Fee: " + oldCharge + " -> " + area.getChargeAmount() + ", Active: " + oldState + " -> " + area.getIsActive() + ")",
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    // 6. OFFERS & ANNOUNCEMENTS
    @GetMapping("/offers")
    public ResponseEntity<List<Offer>> getAdminOffers() {
        return ResponseEntity.ok(offerRepository.findAll());
    }

    @PostMapping("/offers")
    public ResponseEntity<?> createOffer(
            @RequestBody Offer offer,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Offer saved = offerRepository.save(offer);
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "CREATE_OFFER", 
                "Created offer: " + offer.getTitle() + " (" + offer.getPromoCode() + ")",
                request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/offers/{id}")
    public ResponseEntity<?> updateOffer(
            @PathVariable Long id,
            @RequestBody Offer details,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Offer> offerOpt = offerRepository.findById(id);
        if (offerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Offer not found");
        }

        Offer offer = offerOpt.get();
        offer.setTitle(details.getTitle());
        offer.setTitleTelugu(details.getTitleTelugu());
        offer.setDescription(details.getDescription());
        offer.setDescriptionTelugu(details.getDescriptionTelugu());
        offer.setDiscountPercentage(details.getDiscountPercentage());
        offer.setPromoCode(details.getPromoCode());
        offer.setBannerUrl(details.getBannerUrl());
        offer.setStartDate(details.getStartDate());
        offer.setEndDate(details.getEndDate());
        offer.setIsActive(details.getIsActive());

        Offer updated = offerRepository.save(offer);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_OFFER", 
                "Updated offer: " + offer.getTitle(),
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/offers/{id}")
    public ResponseEntity<?> deleteOffer(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Offer> offerOpt = offerRepository.findById(id);
        if (offerOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Offer not found");
        }

        Offer offer = offerOpt.get();
        offerRepository.delete(offer);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "DELETE_OFFER", 
                "Deleted offer " + offer.getTitle(),
                request.getRemoteAddr());

        return ResponseEntity.ok("Offer deleted successfully");
    }

    // 7. GALLERY MANAGEMENT
    @GetMapping("/gallery")
    public ResponseEntity<List<Gallery>> getAdminGallery() {
        return ResponseEntity.ok(galleryRepository.findAll());
    }

    @PostMapping("/gallery")
    public ResponseEntity<?> addGalleryImage(
            @RequestBody Gallery gallery,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Gallery saved = galleryRepository.save(gallery);
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "ADD_GALLERY_IMAGE", 
                "Added gallery image with caption: " + gallery.getCaption(),
                request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/gallery/{id}")
    public ResponseEntity<?> deleteGalleryImage(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Gallery> itemOpt = galleryRepository.findById(id);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Gallery image not found");
        }

        Gallery item = itemOpt.get();
        galleryRepository.delete(item);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "DELETE_GALLERY_IMAGE", 
                "Deleted gallery image ID: " + id,
                request.getRemoteAddr());

        return ResponseEntity.ok("Gallery image deleted successfully");
    }

    // 8. ANNOUNCEMENTS
    @GetMapping("/announcements")
    public ResponseEntity<List<Announcement>> getAdminAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAll());
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> createAnnouncement(
            @RequestBody Announcement announcement,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Announcement saved = announcementRepository.save(announcement);
        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "CREATE_ANNOUNCEMENT", 
                "Created announcement: " + announcement.getText(),
                request.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/announcements/{id}")
    public ResponseEntity<?> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody Announcement details,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Announcement> annOpt = announcementRepository.findById(id);
        if (annOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Announcement not found");
        }

        Announcement announcement = annOpt.get();
        announcement.setText(details.getText());
        announcement.setTextTelugu(details.getTextTelugu());
        announcement.setIsActive(details.getIsActive());

        Announcement updated = announcementRepository.save(announcement);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_ANNOUNCEMENT", 
                "Updated announcement text: " + announcement.getText(),
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    // 9. BULK ORDERS
    @GetMapping("/bulk-orders")
    public ResponseEntity<List<BulkOrder>> getAdminBulkOrders() {
        return ResponseEntity.ok(bulkOrderRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/bulk-orders/{id}/status")
    public ResponseEntity<?> updateBulkOrderStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<BulkOrder> bulkOpt = bulkOrderRepository.findById(id);
        if (bulkOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Bulk order inquiry not found");
        }

        BulkOrder order = bulkOpt.get();
        String oldStatus = order.getStatus();
        order.setStatus(status.toUpperCase());
        BulkOrder updated = bulkOrderRepository.save(order);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_BULK_ORDER_STATUS", 
                "Bulk order inquiry #" + id + " status updated from " + oldStatus + " to " + status.toUpperCase(),
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    // 10. REVIEWS MODERATION
    @GetMapping("/reviews")
    public ResponseEntity<List<Review>> getAdminReviews() {
        return ResponseEntity.ok(reviewRepository.findAll());
    }

    @PutMapping("/reviews/{id}/approve")
    public ResponseEntity<?> approveReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Review> reviewOpt = reviewRepository.findById(id);
        if (reviewOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
        }

        Review review = reviewOpt.get();
        review.setIsApproved(true);
        Review updated = reviewRepository.save(review);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "APPROVE_REVIEW", 
                "Approved review by customer: " + review.getCustomerName(),
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<Review> reviewOpt = reviewRepository.findById(id);
        if (reviewOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Review not found");
        }

        Review review = reviewOpt.get();
        reviewRepository.delete(review);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "DELETE_REVIEW", 
                "Deleted/Rejected review by customer: " + review.getCustomerName(),
                request.getRemoteAddr());

        return ResponseEntity.ok("Review deleted successfully");
    }

    // 11. CUSTOMERS DIRECTORY
    @GetMapping("/customers")
    public ResponseEntity<?> getCustomersList() {
        List<User> customers = userRepository.findAll().stream()
                .filter(u -> "ROLE_CUSTOMER".equals(u.getRole()))
                .toList();

        List<Map<String, Object>> response = new ArrayList<>();
        for (User c : customers) {
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("id", c.getId());
            cMap.put("phone", c.getPhone());
            cMap.put("createdAt", c.getCreatedAt());

            CustomerProfile profile = customerProfileRepository.findByUserId(c.getId()).orElse(null);
            cMap.put("name", profile != null ? profile.getName() : "Unknown");
            cMap.put("email", profile != null ? profile.getEmail() : "");
            cMap.put("preferredLanguage", profile != null ? profile.getPreferredLanguage() : "en");

            List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(c.getId());
            cMap.put("ordersCount", orders.size());
            cMap.put("totalSpent", orders.stream()
                    .filter(o -> "DELIVERED".equals(o.getStatus()))
                    .map(Order::getGrandTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));

            response.add(cMap);
        }
        return ResponseEntity.ok(response);
    }

    // 12. AUDIT LOGS
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        return ResponseEntity.ok(auditLogRepository.findAllByOrderByCreatedAtDesc());
    }

    // 13. FILE UPLOAD (FOR PRODUCTS/GALLERY IMAGES)
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String url = fileStorageService.storeFile(file);
            Map<String, String> response = new HashMap<>();
            response.put("url", url);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Image upload failed: " + e.getMessage());
        }
    }

    // 14. CALLBACK REQUESTS
    @GetMapping("/callbacks")
    public ResponseEntity<List<CallbackRequest>> getAdminCallbacks() {
        return ResponseEntity.ok(callbackRequestRepository.findAllByOrderByCreatedAtDesc());
    }

    @PutMapping("/callbacks/{id}")
    public ResponseEntity<?> updateCallbackRequest(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String adminNotes,
            @AuthenticationPrincipal UserDetailsImpl adminDetails,
            HttpServletRequest request) {
        
        Optional<CallbackRequest> callbackOpt = callbackRequestRepository.findById(id);
        if (callbackOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Callback request not found");
        }

        CallbackRequest callback = callbackOpt.get();
        String oldStatus = callback.getStatus();
        callback.setStatus(status.toUpperCase());
        if (adminNotes != null) {
            callback.setAdminNotes(adminNotes);
        }
        CallbackRequest updated = callbackRequestRepository.save(callback);

        User adminUser = userRepository.findById(adminDetails.getId()).orElse(null);
        auditLogService.log(adminUser, "UPDATE_CALLBACK_STATUS", 
                "Callback request #" + id + " status changed from " + oldStatus + " to " + status.toUpperCase(),
                request.getRemoteAddr());

        return ResponseEntity.ok(updated);
    }

    // 15. CSV EXPORTS
    @GetMapping("/orders/csv")
    public ResponseEntity<String> exportOrdersCsv() {
        StringBuilder csv = new StringBuilder("Order ID,Customer/Guest Phone,Type,Status,Grand Total,Payment Method,Payment Status,Delivery Village,Created At\n");
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        for (Order o : orders) {
            String contact = o.getUser() != null ? o.getUser().getPhone() : o.getGuestName() + " (" + o.getGuestPhone() + ")";
            csv.append(o.getId()).append(",")
               .append(escapeCsv(contact)).append(",")
               .append(o.getOrderType()).append(",")
               .append(o.getStatus()).append(",")
               .append(o.getGrandTotal()).append(",")
               .append(o.getPaymentMethod()).append(",")
               .append(o.getPaymentStatus()).append(",")
               .append(escapeCsv(o.getDeliveryVillage())).append(",")
               .append(o.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=orders.csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csv.toString());
    }

    @GetMapping("/bulk-orders/csv")
    public ResponseEntity<String> exportBulkOrdersCsv() {
        StringBuilder csv = new StringBuilder("Inquiry ID,Customer Name,Phone,Event Type,Event Date,Expected Quantity,Notes,Status,Created At\n");
        List<BulkOrder> bulkOrders = bulkOrderRepository.findAllByOrderByCreatedAtDesc();
        for (BulkOrder b : bulkOrders) {
            csv.append(b.getId()).append(",")
               .append(escapeCsv(b.getName())).append(",")
               .append(escapeCsv(b.getPhone())).append(",")
               .append(escapeCsv(b.getEventType())).append(",")
               .append(b.getEventDate()).append(",")
               .append(escapeCsv(b.getExpectedQuantity())).append(",")
               .append(escapeCsv(b.getNotes())).append(",")
               .append(b.getStatus()).append(",")
               .append(b.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=bulk_inquiries.csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csv.toString());
    }

    @GetMapping("/callbacks/csv")
    public ResponseEntity<String> exportCallbacksCsv() {
        StringBuilder csv = new StringBuilder("Callback ID,Name,Phone,Status,Admin Notes,Created At\n");
        List<CallbackRequest> callbacks = callbackRequestRepository.findAllByOrderByCreatedAtDesc();
        for (CallbackRequest c : callbacks) {
            csv.append(c.getId()).append(",")
               .append(escapeCsv(c.getName())).append(",")
               .append(escapeCsv(c.getPhone())).append(",")
               .append(c.getStatus()).append(",")
               .append(escapeCsv(c.getAdminNotes())).append(",")
               .append(c.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=callbacks.csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csv.toString());
    }

    @GetMapping("/audit-logs/csv")
    public ResponseEntity<String> exportAuditLogsCsv() {
        StringBuilder csv = new StringBuilder("Log ID,User Phone,Action,Details,IP Address,Created At\n");
        List<AuditLog> logs = auditLogRepository.findAllByOrderByCreatedAtDesc();
        for (AuditLog l : logs) {
            String phone = l.getUser() != null ? l.getUser().getPhone() : "SYSTEM";
            csv.append(l.getId()).append(",")
               .append(escapeCsv(phone)).append(",")
               .append(escapeCsv(l.getAction())).append(",")
               .append(escapeCsv(l.getDetails())).append(",")
               .append(escapeCsv(l.getIpAddress())).append(",")
               .append(l.getCreatedAt()).append("\n");
        }
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit_logs.csv")
                .header("Content-Type", "text/csv; charset=UTF-8")
                .body(csv.toString());
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        String raw = value.replace("\"", "\"\"");
        if (raw.contains(",") || raw.contains("\n") || raw.contains("\"")) {
            return "\"" + raw + "\"";
        }
        return raw;
    }
}
