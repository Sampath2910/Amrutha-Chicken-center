package com.amrutha.services;

import com.amrutha.dto.OrderDtos.*;
import com.amrutha.models.*;
import com.amrutha.repositories.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SettingRepository settingRepository;

    @Mock
    private DeliveryAreaRepository deliveryAreaRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    private Product freshChicken;
    private Product chapathi;
    private Setting shopStatusOpen;
    private Setting cookingRate;
    private DeliveryArea morthadArea;

    @BeforeEach
    public void setup() {
        freshChicken = new Product();
        freshChicken.setId(1L);
        freshChicken.setName("Fresh Chicken");
        freshChicken.setIsChicken(true);
        freshChicken.setBasePrice(new BigDecimal("250.00"));
        freshChicken.setStatus("AVAILABLE");

        chapathi = new Product();
        chapathi.setId(2L);
        chapathi.setName("Fresh Chapathi");
        chapathi.setIsChicken(false);
        chapathi.setBasePrice(new BigDecimal("15.00"));
        chapathi.setStatus("AVAILABLE");

        shopStatusOpen = new Setting("shop_status", "OPEN", "Shop Status", LocalDateTime.now());
        cookingRate = new Setting("cooking_charge_per_kg", "220.00", "Cooking Charge", LocalDateTime.now());
        
        morthadArea = new DeliveryArea();
        morthadArea.setId(1L);
        morthadArea.setVillageName("Morthad");
        morthadArea.setChargeAmount(new BigDecimal("50.00"));
        morthadArea.setIsActive(true);
    }

    private void assertBigDecimalEquals(BigDecimal expected, BigDecimal actual) {
        if (expected == null || actual == null) {
            assertEquals(expected, actual);
        } else {
            assertEquals(0, expected.compareTo(actual), 
                String.format("Expected %s but got %s", expected, actual));
        }
    }

    @Test
    public void testPlaceOrder_PickupNoCooking() {
        // Mocking repo lookups
        when(settingRepository.findById("shop_status")).thenReturn(Optional.of(shopStatusOpen));
        when(settingRepository.findById("cooking_charge_per_kg")).thenReturn(Optional.of(cookingRate));
        when(productRepository.findById(1L)).thenReturn(Optional.of(freshChicken));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Create Order Request
        OrderRequest request = new OrderRequest();
        request.setOrderType("PICKUP");
        request.setPaymentMethod("COD");
        
        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(1L);
        item.setQuantityValue(new BigDecimal("1.5"));
        item.setQuantityUnit("KG");
        item.setCookingApplied(false);
        request.setItems(Collections.singletonList(item));

        // Execute service call
        Order order = orderService.placeOrder(request, null);

        // Verification assertions
        assertNotNull(order);
        assertEquals("PENDING", order.getStatus());
        assertBigDecimalEquals(new BigDecimal("375.00"), order.getItemTotal()); // 1.5 * 250
        assertBigDecimalEquals(BigDecimal.ZERO, order.getCookingCharge());
        assertBigDecimalEquals(BigDecimal.ZERO, order.getDeliveryCharge());
        assertBigDecimalEquals(new BigDecimal("375.00"), order.getGrandTotal());
    }

    @Test
    public void testPlaceOrder_PickupWithCooking() {
        when(settingRepository.findById("shop_status")).thenReturn(Optional.of(shopStatusOpen));
        when(settingRepository.findById("cooking_charge_per_kg")).thenReturn(Optional.of(cookingRate));
        when(productRepository.findById(1L)).thenReturn(Optional.of(freshChicken));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderRequest request = new OrderRequest();
        request.setOrderType("PICKUP");
        request.setPaymentMethod("COD");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(1L);
        item.setQuantityValue(new BigDecimal("1.5"));
        item.setQuantityUnit("KG");
        item.setCookingApplied(true);
        request.setItems(Collections.singletonList(item));

        Order order = orderService.placeOrder(request, null);

        assertNotNull(order);
        assertBigDecimalEquals(new BigDecimal("375.00"), order.getItemTotal());
        // Cooking Charge: 1.5 KG * 220.00 = 330.00
        assertBigDecimalEquals(new BigDecimal("330.00"), order.getCookingCharge());
        assertBigDecimalEquals(BigDecimal.ZERO, order.getDeliveryCharge());
        assertBigDecimalEquals(new BigDecimal("705.00"), order.getGrandTotal()); // 375 + 330
    }

    @Test
    public void testPlaceOrder_DeliveryUnderLimit_ThrowsException() {
        when(settingRepository.findById("shop_status")).thenReturn(Optional.of(shopStatusOpen));
        when(settingRepository.findById("cooking_charge_per_kg")).thenReturn(Optional.of(cookingRate));
        when(productRepository.findById(1L)).thenReturn(Optional.of(freshChicken));

        OrderRequest request = new OrderRequest();
        request.setOrderType("DELIVERY");
        request.setPaymentMethod("COD");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(1L);
        item.setQuantityValue(new BigDecimal("0.5")); // 0.5 KG is less than 1.0 KG limit
        item.setQuantityUnit("KG");
        item.setCookingApplied(false);
        request.setItems(Collections.singletonList(item));

        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.placeOrder(request, null);
        });

        assertTrue(exception.getMessage().contains("Home Delivery is only available for orders of 1 KG and above"));
    }

    @Test
    public void testPlaceOrder_DeliveryValidWithCharges() {
        when(settingRepository.findById("shop_status")).thenReturn(Optional.of(shopStatusOpen));
        when(settingRepository.findById("cooking_charge_per_kg")).thenReturn(Optional.of(cookingRate));
        when(productRepository.findById(1L)).thenReturn(Optional.of(freshChicken));
        when(deliveryAreaRepository.findByVillageNameIgnoreCase("Morthad")).thenReturn(Optional.of(morthadArea));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderRequest request = new OrderRequest();
        request.setOrderType("DELIVERY");
        request.setPaymentMethod("COD");
        request.setDeliveryVillage("Morthad");
        request.setDeliveryAddress("Lane 4, Near Bus Stand");

        OrderItemRequest item = new OrderItemRequest();
        item.setProductId(1L);
        item.setQuantityValue(new BigDecimal("1.0")); // 1.0 KG satisfies the delivery limit
        item.setQuantityUnit("KG");
        item.setCookingApplied(false);
        request.setItems(Collections.singletonList(item));

        Order order = orderService.placeOrder(request, null);

        assertNotNull(order);
        assertBigDecimalEquals(new BigDecimal("250.00"), order.getItemTotal());
        assertBigDecimalEquals(BigDecimal.ZERO, order.getCookingCharge());
        assertBigDecimalEquals(new BigDecimal("50.00"), order.getDeliveryCharge());
        assertBigDecimalEquals(new BigDecimal("300.00"), order.getGrandTotal()); // 250 + 50
    }
}
