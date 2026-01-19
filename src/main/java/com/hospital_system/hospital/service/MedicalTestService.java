package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import com.hospital_system.hospital.repository.MedicalTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalTestService {

    @Autowired
    private MedicalTestRepository medicalTestRepository;

    public MedicalTest addTest(MedicalTest test) {
        return medicalTestRepository.save(test);
    }

    public List<MedicalTest> getAllTests() {
        return medicalTestRepository.findByActiveTrue();
    }

    public List<MedicalTest> getTestsByType(TestType type) {
        return medicalTestRepository.findByType(type);
    }
}
