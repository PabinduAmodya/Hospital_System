package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Role;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.exception.BadRequestException;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.UserRepository;
import jakarta.validation.Valid;
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

    // Get all users
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Create user (cashier, receptionist, etc.)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/users")
    public User createUser(@Valid @RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    // Update user (name/username/role, optional password)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
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

        return userRepository.save(existing);
    }

    // Delete user
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    public String deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User not found: " + id);
        }
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
