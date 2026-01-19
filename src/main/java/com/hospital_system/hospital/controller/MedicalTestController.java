package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import com.hospital_system.hospital.service.MedicalTestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
public class MedicalTestController {

    @Autowired
    private MedicalTestService medicalTestService;

    // Admin add lab or radiology test
    @PostMapping
    public MedicalTest addTest(@RequestBody MedicalTest test) {
        return medicalTestService.addTest(test);
    }

    // Get all active tests
    @GetMapping
    public List<MedicalTest> getAllTests() {
        return medicalTestService.getAllTests();
    }

    // Get tests by type (LAB / RADIOLOGY)
    @GetMapping("/type/{type}")
    public List<MedicalTest> getTestsByType(@PathVariable TestType type) {
        return medicalTestService.getTestsByType(type);
    }
}
