package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.MedicalTestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MedicalTestService {

    @Autowired
    private MedicalTestRepository medicalTestRepository;

    public MedicalTest create(MedicalTest test) {
        test.setActive(true);
        return medicalTestRepository.save(test);
    }

    public List<MedicalTest> getAllActive() {
        return medicalTestRepository.findByActiveTrue();
    }

    public MedicalTest getById(Long id) {
        return medicalTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medical test not found: " + id));
    }

    public List<MedicalTest> getByType(TestType type) {
        return medicalTestRepository.findByType(type);
    }

    public MedicalTest update(Long id, MedicalTest updated) {
        MedicalTest existing = getById(id);
        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setPrice(updated.getPrice());
        existing.setDescription(updated.getDescription());
        // do not auto-flip active unless provided
        return medicalTestRepository.save(existing);
    }

    public void deactivate(Long id) {
        MedicalTest existing = getById(id);
        existing.setActive(false);
        medicalTestRepository.save(existing);
    }

    // Backward compatible
    public MedicalTest addTest(MedicalTest test) { return create(test); }
    public List<MedicalTest> getAllTests() { return getAllActive(); }
    public List<MedicalTest> getTestsByType(TestType type) { return getByType(type); }
}
