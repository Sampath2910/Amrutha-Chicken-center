package com.amrutha.models;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_telugu", nullable = false, length = 100)
    private String nameTelugu;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_telugu", columnDefinition = "TEXT")
    private String descriptionTelugu;

    @Column(name = "base_price", precision = 10, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "is_chicken")
    private Boolean isChicken; // If true, daily cooking rates can apply (for fresh raw chicken)

    @Column(nullable = false, length = 30)
    private String status; // AVAILABLE, LIMITED_STOCK, OUT_OF_STOCK

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
