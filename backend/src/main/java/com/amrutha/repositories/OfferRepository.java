package com.amrutha.repositories;

import com.amrutha.models.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByIsActiveTrue();
    Optional<Offer> findByPromoCode(String promoCode);
}
