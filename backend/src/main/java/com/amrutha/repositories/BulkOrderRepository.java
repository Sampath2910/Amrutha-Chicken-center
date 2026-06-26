package com.amrutha.repositories;

import com.amrutha.models.BulkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BulkOrderRepository extends JpaRepository<BulkOrder, Long> {
    List<BulkOrder> findAllByOrderByCreatedAtDesc();
}
