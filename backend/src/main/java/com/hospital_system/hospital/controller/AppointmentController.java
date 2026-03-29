package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.AppointmentDTO;
import com.hospital_system.hospital.dto.CancelAppointmentDTO;
import com.hospital_system.hospital.dto.StatusUpdateDTO;
import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    // Book new appointment — fee is auto-calculated from doctor + hospital charge
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody AppointmentDTO appointmentDTO) {
        try {
            Appointment appointment = appointmentService.bookAppointment(
                    appointmentDTO.getPatientId(),
                    appointmentDTO.getScheduleId(),
                    appointmentDTO.getAppointmentDate()
            );
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get all appointments
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // Get appointment by ID
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.getAppointmentById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Update appointment status (PENDING → CONFIRMED → COMPLETED → CANCELLED)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody StatusUpdateDTO statusUpdate) {
        try {
            Appointment appointment = appointmentService.updateStatus(
                    id,
                    statusUpdate.getStatus(),
                    statusUpdate.getNotes()
            );
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Cancel appointment
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id,
                                               @RequestBody CancelAppointmentDTO cancelDTO) {
        try {
            Appointment appointment = appointmentService.cancelAppointment(
                    id,
                    cancelDTO.getCancellationReason(),
                    cancelDTO.isRefundRequired()
            );
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Reschedule appointment to next available date on same schedule day
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(@PathVariable Long id) {
        try {
            Appointment newAppointment = appointmentService.rescheduleToNextAvailable(id);
            return ResponseEntity.ok(newAppointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get appointments by status
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping("/status/{status}")
    public List<Appointment> getByStatus(@PathVariable AppointmentStatus status) {
        return appointmentService.getAppointmentsByStatus(status);
    }

    // Get today's appointments
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping("/today")
    public List<Appointment> getTodayAppointments() {
        return appointmentService.getTodayAppointments();
    }

    // Get today's appointment queue sorted by token number
    @GetMapping("/today/queue")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    public ResponseEntity<?> getTodayQueue() {
        List<Appointment> todayAppointments = appointmentService.getTodayAppointments();
        todayAppointments.sort((a, b) -> {
            if (a.getTokenNumber() == null) return 1;
            if (b.getTokenNumber() == null) return -1;
            return a.getTokenNumber().compareTo(b.getTokenNumber());
        });
        return ResponseEntity.ok(todayAppointments);
    }

    // Get appointments by patient
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping("/patient/{patientId}")
    public List<Appointment> getByPatient(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    // Get appointments by doctor
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getByDoctor(@PathVariable Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }

    // Get available future dates for rescheduling — used by frontend date picker modal
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @GetMapping("/{id}/available-dates")
    public ResponseEntity<?> getAvailableDates(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(appointmentService.getAvailableDatesForReschedule(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Reschedule to a specific chosen date
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST','CASHIER')")
    @PutMapping("/{id}/reschedule-to")
    public ResponseEntity<?> rescheduleToDate(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, String> body) {
        try {
            java.time.LocalDate newDate = java.time.LocalDate.parse(body.get("date"));
            Appointment appt = appointmentService.rescheduleToDate(id, newDate);
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}