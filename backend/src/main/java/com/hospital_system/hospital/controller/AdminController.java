package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.entity.Role;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.exception.BadRequestException;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.DoctorRepository;
import com.hospital_system.hospital.repository.UserRepository;
import jakarta.validation.Valid;
import com.hospital_system.hospital.service.PasswordResetService;
import com.hospital_system.hospital.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private DoctorRepository doctorRepository;

    // Get all users
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Create user (cashier, receptionist, doctor, etc.)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users")
    public User createUser(@Valid @RequestBody User user, @RequestParam(required = false) Long doctorId) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        String rawPassword = user.getPassword();
        user.setPassword(passwordEncoder.encode(rawPassword));

        // Link doctor record if role is DOCTOR and doctorId is provided
        if (user.getRole() == Role.DOCTOR && doctorId != null) {
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                user.setDoctor(doctor);
            }
        }

        User saved = userRepository.save(user);
        // Send welcome email if email provided
        if (saved.getEmail() != null && !saved.getEmail().isBlank()) {
            passwordResetService.sendWelcome(saved, rawPassword);
        }
        try { auditLogService.log("CREATE", "USER", saved.getId(), "Created user: " + saved.getUsername() + " with role: " + saved.getRole()); } catch (Exception e) { /* audit log should never break main flow */ }
        return saved;
    }

    // Update user (name/username/role, optional password)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user, @RequestParam(required = false) Long doctorId) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        // username uniqueness check
        if (user.getUsername() != null && !user.getUsername().equals(existing.getUsername())) {
            if (userRepository.existsByUsername(user.getUsername())) {
                throw new BadRequestException("Username already exists");
            }
            existing.setUsername(user.getUsername());
        }

        if (user.getName() != null) existing.setName(user.getName());
        if (user.getRole() != null) existing.setRole(user.getRole());

        // if password provided, encode and update
        if (user.getPassword() != null && !user.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        if (user.getEmail() != null) existing.setEmail(user.getEmail());

        // Link or unlink doctor record
        if (existing.getRole() == Role.DOCTOR && doctorId != null) {
            Doctor doctor = doctorRepository.findById(doctorId).orElse(null);
            if (doctor != null) {
                existing.setDoctor(doctor);
            }
        } else if (existing.getRole() != Role.DOCTOR) {
            existing.setDoctor(null);
        }

        User updated = userRepository.save(existing);
        try { auditLogService.log("UPDATE", "USER", updated.getId(), "Updated user: " + updated.getUsername()); } catch (Exception e) { /* audit log should never break main flow */ }
        return updated;
    }

    // Delete user
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
        try { auditLogService.log("DELETE", "USER", id, "Deleted user with ID: " + id); } catch (Exception e) { /* audit log should never break main flow */ }
        userRepository.deleteById(id);
        return "User deleted successfully";
    }

    // Get users by role
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users/role/{role}")
    public List<User> getUsersByRole(@PathVariable Role role) {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() == role)
                .toList();
    }
}