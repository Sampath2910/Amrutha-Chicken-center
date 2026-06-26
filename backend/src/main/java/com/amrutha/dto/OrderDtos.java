package com.amrutha.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

public class OrderDtos {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderRequest {
        private String guestName;
        private String guestPhone;
        private String orderType; // DELIVERY, PICKUP
        private String paymentMethod; // COD, UPI
        private String upiScreenshotUrl;
        private String deliveryVillage;
        private String deliveryAddress;
        private String deliveryLandmark;
        private String notes;
        private String idempotencyToken;
        private List<OrderItemRequest> items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        private Long productId;
        private BigDecimal quantityValue; // e.g. 0.25, 0.50, 1.00
        private String quantityUnit; // G, KG, PCS
        private Boolean cookingApplied; // true if customer wants raw chicken cooked
    }
}
