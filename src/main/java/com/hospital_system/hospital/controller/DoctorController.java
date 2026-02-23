package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.DoctorDTO;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    // CREATE
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/add")
    public Doctor addDoctor(@Valid @RequestBody DoctorDTO doctorDTO) {
        Doctor doctor = new Doctor(
                doctorDTO.getName(),
                doctorDTO.getSpecialization(),
                doctorDTO.getPhone(),
                doctorDTO.getEmail(),
                doctorDTO.getChanneling_fee()
        );
        return doctorService.create(doctor);
    }

    // READ all
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorService.getAll();
    }

    // READ one
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public Doctor getDoctorById(@PathVariable Long id) {
        return doctorService.getById(id);
    }

    // UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Doctor updateDoctor(@PathVariable Long id, @Valid @RequestBody DoctorDTO doctorDTO) {
        Doctor updated = new Doctor(
                doctorDTO.getName(),
                doctorDTO.getSpecialization(),
                doctorDTO.getPhone(),
                doctorDTO.getEmail(),
                doctorDTO.getChanneling_fee()
        );
        return doctorService.update(id, updated);
    }

    // DELETE
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deleteDoctor(@PathVariable Long id) {
        doctorService.delete(id);
        return "Doctor deleted successfully";
    }
}
