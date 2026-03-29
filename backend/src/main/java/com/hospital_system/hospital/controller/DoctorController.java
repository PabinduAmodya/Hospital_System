package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.DoctorDTO;
import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.entity.User;
import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.UserRepository;
import com.hospital_system.hospital.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

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
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @GetMapping
    public List<Doctor> getAllDoctors() {
        return doctorService.getAll();
    }

    // READ one
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
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

    // ===== Doctor-authenticated endpoints =====

    @GetMapping("/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyProfile() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getDoctor() == null) {
            return ResponseEntity.badRequest().body("No doctor profile linked to this user");
        }
        return ResponseEntity.ok(user.getDoctor());
    }

    @GetMapping("/me/appointments/today")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyTodayAppointments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getDoctor() == null) {
            return ResponseEntity.badRequest().body("No doctor profile linked");
        }
        Long doctorId = user.getDoctor().getId();
        LocalDate today = LocalDate.now();
        List<Appointment> appointments = appointmentRepository.findByDoctorIdAndDate(doctorId, today);
        appointments.sort((a, b) -> {
            if (a.getTokenNumber() == null) return 1;
            if (b.getTokenNumber() == null) return -1;
            return a.getTokenNumber().compareTo(b.getTokenNumber());
        });
        return ResponseEntity.ok(appointments);
    }

    @GetMapping("/me/appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyAppointments() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getDoctor() == null) {
            return ResponseEntity.badRequest().body("No doctor profile linked");
        }
        return ResponseEntity.ok(appointmentRepository.findByDoctorId(user.getDoctor().getId()));
    }

    @GetMapping("/me/patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyPatients() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getDoctor() == null) {
            return ResponseEntity.badRequest().body("No doctor profile linked");
        }
        List<Appointment> appointments = appointmentRepository.findByDoctorId(user.getDoctor().getId());
        Set<Long> patientIds = new HashSet<>();
        List<Patient> patients = new ArrayList<>();
        for (Appointment a : appointments) {
            if (a.getPatient() != null && patientIds.add(a.getPatient().getId())) {
                patients.add(a.getPatient());
            }
        }
        return ResponseEntity.ok(patients);
    }
}
