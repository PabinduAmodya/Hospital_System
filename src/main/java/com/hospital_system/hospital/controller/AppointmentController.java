package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.AppointmentDTO;
import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/book")
    public Appointment bookAppointment(@RequestBody AppointmentDTO appointmentDTO) throws Exception {
        return appointmentService.bookAppointment(
                appointmentDTO.getPatientId(),
                appointmentDTO.getScheduleId(),
                appointmentDTO.getAppointmentDate()
        );
    }
}