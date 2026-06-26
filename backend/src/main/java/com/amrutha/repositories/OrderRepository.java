package com.amrutha.repositories;

import com.amrutha.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByGuestPhoneOrderByCreatedAtDesc(String guestPhone);
    List<Order> findByStatusOrderByCreatedAtDesc(String status);
    List<Order> findAllByOrderByCreatedAtDesc();
    java.util.Optional<Order> findByIdempotencyToken(String idempotencyToken);

    @Query("SELECT SUM(o.grandTotal) FROM Order o WHERE o.status = 'DELIVERED'")
    BigDecimal sumTotalRevenue();

    Long countByCreatedAtAfter(LocalDateTime dateTime);
}
