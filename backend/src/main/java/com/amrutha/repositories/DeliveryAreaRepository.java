package com.amrutha.repositories;

import com.amrutha.models.DeliveryArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface DeliveryAreaRepository extends JpaRepository<DeliveryArea, Long> {
    Optional<DeliveryArea> findByVillageNameIgnoreCase(String villageName);
}
