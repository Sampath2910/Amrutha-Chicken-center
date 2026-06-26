-- V1__init_schema.sql
-- Initial schema and seed data for Amrutha Chicken Center

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(15) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'ROLE_CUSTOMER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customer Profiles Table
CREATE TABLE IF NOT EXISTS customer_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) DEFAULT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    village_name VARCHAR(100) NOT NULL,
    address_line TEXT NOT NULL,
    landmark VARCHAR(150) DEFAULT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addr_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_telugu VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Products Table
CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_telugu VARCHAR(100) NOT NULL,
    description TEXT,
    description_telugu TEXT,
    base_price DECIMAL(10, 2) DEFAULT NULL,
    is_chicken BOOLEAN DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_product_cat (category_id),
    INDEX idx_product_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_img_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Delivery Areas Table
CREATE TABLE IF NOT EXISTS delivery_areas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    village_name VARCHAR(100) NOT NULL UNIQUE,
    charge_amount DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    guest_name VARCHAR(100) DEFAULT NULL,
    guest_phone VARCHAR(15) DEFAULT NULL,
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    item_total DECIMAL(10, 2) NOT NULL,
    cooking_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    upi_screenshot_url VARCHAR(255) DEFAULT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    delivery_village VARCHAR(100) DEFAULT NULL,
    delivery_address TEXT DEFAULT NULL,
    delivery_landmark VARCHAR(150) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    idempotency_token VARCHAR(100) UNIQUE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_status (status),
    INDEX idx_order_user (user_id),
    INDEX idx_order_phone (guest_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    quantity_value DECIMAL(10, 2) NOT NULL,
    quantity_unit VARCHAR(10) NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    cooking_applied BOOLEAN DEFAULT FALSE,
    cooking_charge_rate DECIMAL(10, 2) DEFAULT 0.00,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_item_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    title_telugu VARCHAR(150) NOT NULL,
    description TEXT,
    description_telugu TEXT,
    discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
    promo_code VARCHAR(30) UNIQUE DEFAULT NULL,
    banner_url VARCHAR(255) DEFAULT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255) NOT NULL,
    caption VARCHAR(255) DEFAULT NULL,
    caption_telugu VARCHAR(255) DEFAULT NULL,
    category VARCHAR(50) DEFAULT 'GALLERY',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key_name VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Bulk Orders Table
CREATE TABLE IF NOT EXISTS bulk_orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_date DATE NOT NULL,
    expected_quantity VARCHAR(100) NOT NULL,
    expected_guests INT DEFAULT 0,
    budget DECIMAL(10, 2) DEFAULT 0.00,
    admin_notes TEXT,
    followup_status VARCHAR(50) DEFAULT 'PENDING',
    is_converted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bulk_status (followup_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    text_telugu TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'FRESH_STOCK',
    schedule_start TIMESTAMP NULL DEFAULT NULL,
    schedule_end TIMESTAMP NULL DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    photo_url VARCHAR(255) DEFAULT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rev_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Callback Requests Table
CREATE TABLE IF NOT EXISTS callback_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    status VARCHAR(30) DEFAULT 'NEW',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_callback_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SEED DATA
INSERT INTO settings (key_name, value, description) VALUES
('shop_status', 'OPEN', 'Business Open status (OPEN, CLOSED, or TEMPORARILY_PAUSED)'),
('cooking_charge_per_kg', '220.00', 'Cooking charge per KG of chicken in Rupees'),
('contact_phone', '8977677193', 'Business Phone Contact'),
('whatsapp_number', '8977677193', 'Business WhatsApp Contact'),
('upi_id', '9705525829@axl', 'Business UPI ID for payments'),
('business_hours', '6:00 AM - 9:00 PM', 'Operating Hours'),
('tagline', 'Fresh Every Day, Delicious Every Time', 'Amrutha Chicken Center Tagline'),
('address', 'Morthad, Telangana - 503225', 'Physical Address of the Shop')
ON DUPLICATE KEY UPDATE value=value;

INSERT INTO categories (id, name, name_telugu, slug, description) VALUES
(1, 'Fresh Chicken', 'తాజా చికెన్', 'fresh-chicken', 'Raw and fresh chicken cuts prepared daily.'),
(2, 'Cooked Food Services', 'వండిన ఆహారాలు', 'cooked-food', 'Delicious, home-style chicken curries, dry roasts, and fries.'),
(3, 'Chapathis', 'చపాతీలు', 'chapathis', 'Soft, freshly made chapathis to accompany your chicken orders.')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO delivery_areas (id, village_name, charge_amount, is_active) VALUES
(1, 'Morthad', 50.00, 1),
(2, 'Donkal', 100.00, 1),
(3, 'Sunket', 100.00, 1),
(4, 'Shetpalle', 100.00, 1),
(5, 'Ramannapet', 100.00, 1),
(6, 'Palem', 100.00, 1),
(7, 'Donpal', 100.00, 1),
(8, 'Wadiat', 100.00, 1),
(9, 'Gandlapet', 150.00, 1),
(10, 'Dharmora', 150.00, 1)
ON DUPLICATE KEY UPDATE village_name=village_name;

INSERT INTO products (id, category_id, name, name_telugu, description, description_telugu, base_price, is_chicken, status) VALUES
(1, 1, 'Whole Chicken', 'పూర్తి చికెన్', 'Fresh whole chicken cleaned and dressed. Perfect for home recipes.', 'తాజా పూర్తి చికెన్ శుభ్రం చేయబడింది. ఇంటి వంటకాలకు సరిపోతుంది.', NULL, 1, 'AVAILABLE'),
(2, 1, 'Boneless Chicken', 'బోన్‌లెస్ చికెన్', 'Tender cuts of chicken breast and meat, completely boneless.', 'చికెన్ రొమ్ము ముక్కలు, పూర్తిగా ఎముకలు లేనివి.', NULL, 1, 'AVAILABLE'),
(3, 1, 'Chicken Wings', 'చికెన్ రెక్కలు', 'Juicy chicken wings, cleaned and ready to grill or fry.', 'జుసి చికెన్ రెక్కలు, గ్రిల్ లేదా ఫ్రై చేయడానికి సిద్ధంగా ఉన్నాయి.', NULL, 1, 'AVAILABLE'),
(4, 1, 'Drumsticks', 'డ్రమ్‌స్టిక్స్ (లెగ్ పీసెస్)', 'Fleshy chicken drumsticks, perfect for chicken leg fries and starters.', 'చికెన్ లెగ్ పీసెస్, చికెన్ లెగ్ ఫ్రైస్‌కు సరిపోతుంది.', NULL, 1, 'AVAILABLE'),
(5, 2, 'Chicken Curry', 'చికెన్ కర్రీ', 'Traditional style chicken curry cooked with home spices.', 'సాంప్రదాయ పద్ధతిలో వండిన చికెన్ కర్రీ.', 250.00, 1, 'AVAILABLE'),
(6, 2, 'Chicken Fry', 'చికెన్ ఫ్రై', 'Crispy and spiced deep fried chicken pieces, aromatic local style.', 'క్రిస్పీ మరియు స్పైసీగా వేయించిన చికెన్ ముక్కలు.', 280.00, 1, 'AVAILABLE'),
(7, 2, 'Chicken Dry Roast', 'చికెన్ డ్రై రోస్ట్', 'Dry-roasted chicken with intense masala flavor and curry leaves.', 'మసాలా రుచి మరియు కరివేపాకులతో రోస్ట్ చేసిన చికెన్.', 300.00, 1, 'AVAILABLE'),
(8, 3, 'Single Chapathi', 'ఒకటి చపాతీ', 'Freshly rolled soft single chapathi.', 'తాజాగా చేసిన ఒక చపాతీ.', 15.00, 0, 'AVAILABLE'),
(9, 3, '5 Chapathi Pack', '5 చపాతీల ప్యాక్', 'Pack of 5 soft fresh chapathis.', '5 సాఫ్ట్ చపాతీల ప్యాక్.', 70.00, 0, 'AVAILABLE'),
(10, 3, '10 Chapathi Family Pack', '10 చపాతీల ఫ్యామిలీ ప్యాక్', 'Family pack containing 10 fresh chapathis.', '10 తాజా చపాతీలు ఉన్న ఫ్యామిలీ ప్యాక్.', 140.00, 0, 'AVAILABLE')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO reviews (id, customer_name, rating, comment, is_approved) VALUES
(1, 'Raju Yadav', 5, 'Best chicken shop in Morthad. The chicken is always fresh, and their chicken fry is absolutely delicious! Very fast home delivery too.', 1),
(2, 'Swapna G.', 5, 'Highly recommend their chapathis and chicken curry. Tastes like home-cooked food. It has become our Sunday family meal standard.', 1),
(3, 'Krishna Reddy', 4, 'Very hygienic store and reasonable prices. Order on WhatsApp is very convenient.', 1)
ON DUPLICATE KEY UPDATE customer_name=customer_name;

INSERT INTO users (id, phone, password_hash, role) VALUES
(1, '9705525829', '$2a$10$n6ByaMyJmR5S0FvL5Fjy5uWeAaGV8iqw/Q6xkxW9zx8b..9BkIEfm', 'ROLE_SUPER_ADMIN'),
(2, '8977677193', '$2a$10$wSbyVQCn28JbbiDOGsX9JeeJgQ86I17pEPV39XgQd6gUKsYUY6MRe', 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE phone=phone;

INSERT INTO customer_profiles (id, user_id, name, email, preferred_language) VALUES
(1, 1, 'Amrutha Super Admin', 'owner@amruthachicken.com', 'en'),
(2, 2, 'Amrutha Store Admin', 'admin@amruthachicken.com', 'en')
ON DUPLICATE KEY UPDATE name=name;
