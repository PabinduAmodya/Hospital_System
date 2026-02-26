package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.AuthResponse;
import com.hospital_system.hospital.dto.LoginRequest;
import com.hospital_system.hospital.dto.RegisterRequest;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.repository.UserRepository;
import com.hospital_system.hospital.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.hospital_system.hospital.entity.User;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Load user details
            final UserDetails userDetails = userDetailsService.loadUserByUsername(loginRequest.getUsername());

            // Generate JWT token
            final String jwt = jwtUtil.generateToken(userDetails);

            // Get user info
            User user = userRepository.findByUsername(loginRequest.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Return response with token
            return ResponseEntity.ok(new AuthResponse(
                    jwt,
                    user.getUsername(),
                    user.getRole().name(),
                    "Login successful",
                    user.getName()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid username or password");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during login");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        try {
            // Check if username already exists
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return ResponseEntity.badRequest().body("Username already exists");
            }

            // Create new user
            User user = new User(
                    registerRequest.getName(),
                    registerRequest.getUsername(),
                    passwordEncoder.encode(registerRequest.getPassword()),
                    registerRequest.getRole()
            );

            userRepository.save(user);

            return ResponseEntity.ok("User registered successfully");

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during registration");
        }
    }

    // GET /api/auth/me — return current user profile
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(401).body("Not authenticated");
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(java.util.Map.of(
                "id",       user.getId(),
                "name",     user.getName() != null ? user.getName() : "",
                "username", user.getUsername(),
                "email",    user.getEmail() != null ? user.getEmail() : "",
                "role",     user.getRole().name()
        ));
    }

    // PUT /api/auth/me — update current user's name + email
    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@AuthenticationPrincipal UserDetails userDetails,
                                      @RequestBody java.util.Map<String, String> body) {
        if (userDetails == null) return ResponseEntity.status(401).body("Not authenticated");
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (body.containsKey("name")  && body.get("name")  != null) user.setName(body.get("name"));
        if (body.containsKey("email") && body.get("email") != null) user.setEmail(body.get("email"));
        userRepository.save(user);
        return ResponseEntity.ok(java.util.Map.of(
                "id",       user.getId(),
                "name",     user.getName() != null ? user.getName() : "",
                "username", user.getUsername(),
                "email",    user.getEmail() != null ? user.getEmail() : "",
                "role",     user.getRole().name()
        ));
    }

    // POST /api/auth/change-password — change own password (requires current password)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                            @RequestBody java.util.Map<String, String> body) {
        if (userDetails == null) return ResponseEntity.status(401).body("Not authenticated");
        String currentPassword = body.get("currentPassword");
        String newPassword     = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6)
            return ResponseEntity.badRequest().body("New password must be at least 6 characters");
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword()))
            return ResponseEntity.badRequest().body("Current password is incorrect");
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }

}