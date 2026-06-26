package com.amrutha.controllers;

import com.amrutha.dto.AuthDtos.*;
import com.amrutha.models.CustomerProfile;
import com.amrutha.models.User;
import com.amrutha.repositories.CustomerProfileRepository;
import com.amrutha.repositories.UserRepository;
import com.amrutha.security.JwtUtils;
import com.amrutha.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getPhone(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        String name = "";
        Optional<CustomerProfile> profile = customerProfileRepository.findByUserId(userDetails.getId());
        if (profile.isPresent()) {
            name = profile.get().getName();
        }

        return ResponseEntity.ok(new JwtResponse(
                jwt, 
                userDetails.getId(), 
                userDetails.getUsername(), 
                userDetails.getAuthorities().iterator().next().getAuthority(),
                name
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByPhone(signUpRequest.getPhone())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Phone number is already registered!");
        }

        // Create new user account
        User user = User.builder()
                .phone(signUpRequest.getPhone())
                .passwordHash(encoder.encode(signUpRequest.getPassword()))
                .role("ROLE_CUSTOMER")
                .build();

        User savedUser = userRepository.save(user);

        // Create customer profile
        CustomerProfile profile = CustomerProfile.builder()
                .user(savedUser)
                .name(signUpRequest.getName())
                .email(signUpRequest.getEmail())
                .preferredLanguage("en")
                .build();

        customerProfileRepository.save(profile);

        return ResponseEntity.ok("User registered successfully!");
    }
}
