package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.PasswordResetToken;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.repository.PasswordResetTokenRepository;
import com.hospital_system.hospital.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class PasswordResetService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordResetTokenRepository tokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private EmailService emailService;

    // @Lazy breaks the circular reference — Spring Boot 3 prohibits cycles by default
    @Lazy
    @Autowired
    private PasswordResetService self;

    // ── Forgot password ───────────────────────────────────────────────────────
    public void initiateReset(String email, int expiryHours) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with that email"));

        // Call through proxy via self so REQUIRES_NEW transaction is honoured
        String token = self.saveResetToken(user, expiryHours);

        // Email sent AFTER token is committed — failure won't roll back the token
        emailService.sendPasswordResetEmail(email, user.getName(), token);
    }

    // ── Save token in its own independent transaction ─────────────────────────
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public String saveResetToken(User user, int expiryHours) {
        tokenRepository.deleteByUserId(user.getId());
        tokenRepository.flush();

        String token = UUID.randomUUID().toString();
        PasswordResetToken prt = new PasswordResetToken(
                token, user, LocalDateTime.now().plusHours(expiryHours));
        tokenRepository.save(prt);
        return token;
    }

    // ── Welcome email when admin creates a new user ───────────────────────────
    public void sendWelcome(User user, String tempPassword) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;
        String token = self.saveResetToken(user, 24);
        emailService.sendWelcomeEmail(
                user.getEmail(), user.getName(),
                user.getRole().name(), tempPassword, token);
    }

    // ── Validate token (called by frontend before showing reset form) ─────────
    public User validateToken(String token) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link"));
        if (!prt.isValid()) throw new RuntimeException("This reset link has expired or already been used");
        return prt.getUser();
    }

    // ── Apply the new password ────────────────────────────────────────────────
    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        if (!prt.isValid()) throw new RuntimeException("This reset link has expired or already been used");

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        prt.setUsed(true);
        tokenRepository.save(prt);
    }
}