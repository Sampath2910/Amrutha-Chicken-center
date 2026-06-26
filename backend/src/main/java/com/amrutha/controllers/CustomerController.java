package com.amrutha.controllers;

import com.amrutha.dto.OrderDtos.OrderRequest;
import com.amrutha.models.*;
import com.amrutha.repositories.*;
import com.amrutha.security.UserDetailsImpl;
import com.amrutha.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @GetMapping("/profile")
    public ResponseEntity<?> getCustomerProfile(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userDetails.getId()));
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateCustomerProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody CustomerProfile profileUpdate) {
        CustomerProfile profile = customerProfileRepository.findByUserId(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("Profile not found for user: " + userDetails.getId()));

        profile.setName(profileUpdate.getName());
        profile.setEmail(profileUpdate.getEmail());
        if (profileUpdate.getPreferredLanguage() != null) {
            profile.setPreferredLanguage(profileUpdate.getPreferredLanguage());
        }

        CustomerProfile updated = customerProfileRepository.save(profile);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<Address>> getAddresses(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(addressRepository.findByUserId(userDetails.getId()));
    }

    @PostMapping("/addresses")
    public ResponseEntity<?> addAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody Address address) {
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If this is set to default, unset other default addresses first
        if (Boolean.TRUE.equals(address.getIsDefault())) {
            List<Address> currentAddresses = addressRepository.findByUserId(userDetails.getId());
            for (Address curr : currentAddresses) {
                if (Boolean.TRUE.equals(curr.getIsDefault())) {
                    curr.setIsDefault(false);
                    addressRepository.save(curr);
                }
            }
        }

        address.setUser(user);
        Address saved = addressRepository.save(address);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<?> deleteAddress(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable Long id) {
        Optional<Address> addressOpt = addressRepository.findByIdAndUserId(id, userDetails.getId());
        if (addressOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Address not found or unauthorized");
        }

        addressRepository.delete(addressOpt.get());
        return ResponseEntity.ok("Address deleted successfully");
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrderHistory(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(orderRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId()));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> placeOrder(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestBody OrderRequest orderRequest) {
        try {
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            Order order = orderService.placeOrder(orderRequest, user);
            return ResponseEntity.ok(order);
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Order processing failed: " + e.getMessage());
        }
    }
}
