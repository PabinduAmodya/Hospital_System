package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.DoctorDTO;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.service.DoctorService;
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

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/add")
    public Doctor addDoctor(@RequestBody DoctorDTO doctorDTO) {
        Doctor doctor = new Doctor(
                doctorDTO.getName(),
                doctorDTO.getSpecialization(),
                doctorDTO.getPhone(),
                doctorDTO.getEmail(),
                doctorDTO.getChanneling_fee()
        );
        return doctorService.saveDoctor(doctor);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorService.getAllDoctors();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public Doctor getDoctorById(@PathVariable Long id) {
        Doctor doctor = doctorService.findById(id);
        if (doctor == null) {
            throw new RuntimeException("Doctor not found");
        }
        return doctor;
    }
}