package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import com.hospital_system.hospital.service.MedicalTestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@CrossOrigin(origins = "*")
public class MedicalTestController {

    @Autowired
    private MedicalTestService medicalTestService;

    // CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public MedicalTest addTest(@Valid @RequestBody MedicalTest test) {
        return medicalTestService.create(test);
    }

    // READ all active
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<MedicalTest> getAllTests() {
        return medicalTestService.getAllActive();
    }

    // READ one
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public MedicalTest getTestById(@PathVariable Long id) {
        return medicalTestService.getById(id);
    }

    // READ by type
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/type/{type}")
    public List<MedicalTest> getTestsByType(@PathVariable TestType type) {
        return medicalTestService.getByType(type);
    }

    // UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public MedicalTest updateTest(@PathVariable Long id, @Valid @RequestBody MedicalTest test) {
        return medicalTestService.update(id, test);
    }

    // DELETE (soft delete)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deactivateTest(@PathVariable Long id) {
        medicalTestService.deactivate(id);
        return "Medical test deactivated";
    }
}
