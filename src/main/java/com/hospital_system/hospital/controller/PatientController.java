package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.PatientDTO;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/register")
    public Patient registerPatient(@RequestBody PatientDTO patientDTO) {
        Patient patient = new Patient(
                patientDTO.getName(),
                patientDTO.getPhone(),
                patientDTO.getEmail(),
                patientDTO.getGender(),
                LocalDate.parse(patientDTO.getDob())
        );
        return patientService.addPatient(patient);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public Patient getPatientById(@PathVariable Long id) {
        return patientService.getPatientById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
    }
}