package com.amrutha;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyPassword {

    @Test
    public void testHash() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        System.out.println("=== NEW BCRYPT HASH GENERATION ===");
        System.out.println("SuperAdminPassword123 -> " + encoder.encode("SuperAdminPassword123"));
        System.out.println("AdminPassword123 -> " + encoder.encode("AdminPassword123"));
        System.out.println("==================================");
    }
}
