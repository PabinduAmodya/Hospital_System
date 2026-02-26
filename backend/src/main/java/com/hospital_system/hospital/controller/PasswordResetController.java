package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.service.PasswordResetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class PasswordResetController {

    @Autowired
    private PasswordResetService resetService;

    // Step 1 — request reset email (public, no auth needed)
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body("Email is required");
        try {
            resetService.initiateReset(email, 1); // 1 hour
            return ResponseEntity.ok("Reset email sent. Check your inbox.");
        } catch (Exception e) {
            // Always return ok — don't reveal if email exists
            return ResponseEntity.ok("If that email is registered, a reset link has been sent.");
        }
    }

    // Step 2 — validate token (used by frontend to check token before showing form)
    @GetMapping("/reset-password/validate")
    public ResponseEntity<?> validateToken(@RequestParam String token) {
        try {
            User user = resetService.validateToken(token);
            return ResponseEntity.ok(Map.of("name", user.getName(), "valid", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "message", e.getMessage()));
        }
    }

    // Step 3 — submit new password
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token    = body.get("token");
        String password = body.get("password");
        if (token == null || password == null || password.length() < 6)
            return ResponseEntity.badRequest().body("Token and password (min 6 chars) required");
        try {
            resetService.resetPassword(token, password);
            return ResponseEntity.ok("Password reset successfully. You can now log in.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}