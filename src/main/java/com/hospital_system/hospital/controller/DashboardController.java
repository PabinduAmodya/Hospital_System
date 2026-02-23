package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.BillRepository;
import com.hospital_system.hospital.repository.PatientRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER', 'DOCTOR')")
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        Map<String, Object> data = new HashMap<>();
        data.put("totalPatients", patientRepository.count());
        data.put("todayAppointments", appointmentRepository.countToday());
        data.put("totalRevenue", billRepository.sumRevenue());
        data.put("pendingBills", billRepository.countPending());
        return data;
    }
}
