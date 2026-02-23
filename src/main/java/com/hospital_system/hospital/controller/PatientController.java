package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.PatientDTO;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.service.PatientService;
import jakarta.validation.Valid;
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

    // CREATE
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/register")
    public Patient registerPatient(@Valid @RequestBody PatientDTO patientDTO) {
        Patient patient = new Patient(
                patientDTO.getName(),
                patientDTO.getPhone(),
                patientDTO.getEmail(),
                patientDTO.getGender(),
                LocalDate.parse(patientDTO.getDob())
        );
        return patientService.create(patient);
    }

    // READ all
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAll();
    }

    // READ one
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public Patient getPatientById(@PathVariable Long id) {
        return patientService.getById(id);
    }

    // UPDATE
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PutMapping("/{id}")
    public Patient updatePatient(@PathVariable Long id, @Valid @RequestBody PatientDTO patientDTO) {
        Patient updated = new Patient(
                patientDTO.getName(),
                patientDTO.getPhone(),
                patientDTO.getEmail(),
                patientDTO.getGender(),
                LocalDate.parse(patientDTO.getDob())
        );
        return patientService.update(id, updated);
    }

    // DELETE
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deletePatient(@PathVariable Long id) {
        patientService.delete(id);
        return "Patient deleted successfully";
    }

    // Patient history (appointments + bills + payments)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'DOCTOR', 'CASHIER')")
    @GetMapping("/{id}/history")
    public Object getPatientHistory(@PathVariable Long id) {
        return patientService.getHistory(id);
    }

}
