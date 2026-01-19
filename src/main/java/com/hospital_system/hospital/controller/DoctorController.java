package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.DoctorDTO;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    // Add doctor
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

    // Get all doctors
    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorService.getAllDoctors();
    }
}
