package com.amrutha.services;

import com.amrutha.dto.OrderDtos.*;
import com.amrutha.models.*;
import com.amrutha.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(OrderService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SettingRepository settingRepository;

    @Autowired
    private DeliveryAreaRepository deliveryAreaRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public Order placeOrder(OrderRequest request, User user) {
        // 0. Idempotency Check to prevent double submissions
        if (request.getIdempotencyToken() != null && !request.getIdempotencyToken().trim().isEmpty()) {
            java.util.Optional<Order> existingOrder = orderRepository.findByIdempotencyToken(request.getIdempotencyToken());
            if (existingOrder.isPresent()) {
                logger.warn("Duplicate order request detected. Returning existing order #{}", existingOrder.get().getId());
                return existingOrder.get();
            }
        }

        // 1. Check if shop is OPEN
        Setting shopStatusSetting = settingRepository.findById("shop_status")
                .orElse(new Setting("shop_status", "OPEN", "Shop Status", LocalDateTime.now()));
        if ("CLOSED".equalsIgnoreCase(shopStatusSetting.getValue())) {
            throw new IllegalStateException("Orders are currently unavailable. Please call 8977677193.");
        }

        // 2. Fetch active cooking charge rate
        Setting cookingChargeSetting = settingRepository.findById("cooking_charge_per_kg")
                .orElse(new Setting("cooking_charge_per_kg", "220.00", "Cooking Charge", LocalDateTime.now()));
        BigDecimal cookingRate = new BigDecimal(cookingChargeSetting.getValue());

        Order order = new Order();
        order.setUser(user);
        order.setOrderType(request.getOrderType());
        order.setPaymentMethod(request.getPaymentMethod());
        order.setUpiScreenshotUrl(request.getUpiScreenshotUrl());
        order.setNotes(request.getNotes());
        order.setIdempotencyToken(request.getIdempotencyToken());
        order.setStatus("PENDING");
        order.setPaymentStatus("PENDING");

        if (user == null) {
            order.setGuestName(request.getGuestName());
            order.setGuestPhone(request.getGuestPhone());
        } else {
            order.setGuestName(null);
            order.setGuestPhone(null);
        }

        BigDecimal itemTotal = BigDecimal.ZERO;
        BigDecimal totalCookingCharge = BigDecimal.ZERO;
        BigDecimal totalWeightKg = BigDecimal.ZERO;

        List<OrderItem> itemsToSave = new ArrayList<>();

        // 3. Process each item
        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + itemReq.getProductId()));

            if (!"AVAILABLE".equalsIgnoreCase(product.getStatus())) {
                throw new IllegalArgumentException("Product '" + product.getName() + "' is currently out of stock.");
            }

            BigDecimal quantity = itemReq.getQuantityValue();
            String unit = itemReq.getQuantityUnit().toUpperCase();

            // Calculate item weight in KG for rules validation and cooking charges
            BigDecimal weightInKg = BigDecimal.ZERO;
            if ("KG".equals(unit)) {
                weightInKg = quantity;
            } else if ("G".equals(unit)) {
                weightInKg = quantity.divide(new BigDecimal("1000"), 4, RoundingMode.HALF_UP);
            }

            // Total weight counts for delivery validation
            totalWeightKg = totalWeightKg.add(weightInKg);

            // Calculate item base price subtotal
            BigDecimal price = product.getBasePrice();
            BigDecimal itemSubtotal = price.multiply(quantity);
            itemTotal = itemTotal.add(itemSubtotal);

            // Calculate cooking charge if product is chicken and cooking is applied
            BigDecimal itemCookingCharge = BigDecimal.ZERO;
            boolean cookingApplied = Boolean.TRUE.equals(product.getIsChicken()) && 
                    Boolean.TRUE.equals(itemReq.getCookingApplied());

            if (cookingApplied) {
                // Cooking charge = weight in KG * cooking rate
                itemCookingCharge = weightInKg.multiply(cookingRate).setScale(2, RoundingMode.HALF_UP);
                totalCookingCharge = totalCookingCharge.add(itemCookingCharge);
            }

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantityValue(quantity)
                    .quantityUnit(unit)
                    .pricePerUnit(price)
                    .cookingApplied(cookingApplied)
                    .cookingChargeRate(cookingApplied ? cookingRate : BigDecimal.ZERO)
                    .subtotal(itemSubtotal.add(itemCookingCharge))
                    .build();

            itemsToSave.add(orderItem);
        }

        // 4. Validate Delivery constraints
        BigDecimal deliveryCharge = BigDecimal.ZERO;
        if ("DELIVERY".equalsIgnoreCase(request.getOrderType())) {
            if (totalWeightKg.compareTo(BigDecimal.ONE) < 0) {
                throw new IllegalArgumentException("Home Delivery is only available for orders of 1 KG and above. Your order total weight is: " + totalWeightKg.setScale(2, RoundingMode.HALF_UP) + " KG. Please add more items or choose Pickup.");
            }

            // Lookup village delivery charge
            String village = request.getDeliveryVillage();
            if (village == null || village.trim().isEmpty()) {
                throw new IllegalArgumentException("Delivery village must be specified for home delivery.");
            }

            DeliveryArea area = deliveryAreaRepository.findByVillageNameIgnoreCase(village.trim())
                    .orElseThrow(() -> new IllegalArgumentException("We do not deliver to '" + village + "'. Please choose an eligible village or select Pickup."));

            if (!Boolean.TRUE.equals(area.getIsActive())) {
                throw new IllegalArgumentException("Delivery to '" + village + "' is temporarily suspended.");
            }

            deliveryCharge = area.getChargeAmount();
            order.setDeliveryVillage(area.getVillageName());
            order.setDeliveryAddress(request.getDeliveryAddress());
            order.setDeliveryLandmark(request.getDeliveryLandmark());
        } else {
            // PICKUP
            order.setDeliveryVillage(null);
            order.setDeliveryAddress(null);
            order.setDeliveryLandmark(null);
        }

        // 5. Finalize totals
        order.setItemTotal(itemTotal);
        order.setCookingCharge(totalCookingCharge);
        order.setDeliveryCharge(deliveryCharge);
        BigDecimal grandTotal = itemTotal.add(totalCookingCharge).add(deliveryCharge);
        order.setGrandTotal(grandTotal);

        // Associate items with order
        for (OrderItem item : itemsToSave) {
            order.addOrderItem(item);
        }

        Order savedOrder = orderRepository.save(order);

        // 6. Trigger in-app notifications
        try {
            // Customer notification (if registered customer)
            if (user != null) {
                notificationService.createNotification(user, 
                    "Your order #" + savedOrder.getId() + " has been placed successfully and is pending approval.", 
                    "ORDER_STATUS");
            }
            // Admin notification (user is null -> broad alert for all store admins)
            String customerName = user != null ? user.getPhone() : savedOrder.getGuestName();
            notificationService.createNotification(null, 
                "New Order #" + savedOrder.getId() + " placed by " + customerName + " (Total: Rs. " + savedOrder.getGrandTotal() + ")", 
                "NEW_ORDER");
        } catch (Exception e) {
            logger.error("Failed to generate in-app notifications for order #{}: {}", savedOrder.getId(), e.getMessage());
        }

        return savedOrder;
    }
}
