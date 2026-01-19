package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.PatientDTO;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.service.PatientService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

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

    @GetMapping
    public List<Patient> getAllPatients() {
        return patientService.getAllPatients();
    }
}



