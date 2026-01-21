package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import com.hospital_system.hospital.service.MedicalTestService;
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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public MedicalTest addTest(@RequestBody MedicalTest test) {
        return medicalTestService.addTest(test);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<MedicalTest> getAllTests() {
        return medicalTestService.getAllTests();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/type/{type}")
    public List<MedicalTest> getTestsByType(@PathVariable TestType type) {
        return medicalTestService.getTestsByType(type);
    }
}