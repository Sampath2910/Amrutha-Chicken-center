package com.amrutha.repositories;

import com.amrutha.models.CallbackRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CallbackRequestRepository extends JpaRepository<CallbackRequest, Long> {
    List<CallbackRequest> findAllByOrderByCreatedAtDesc();
}
