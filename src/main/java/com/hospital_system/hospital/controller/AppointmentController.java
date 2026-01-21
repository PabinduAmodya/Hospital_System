package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.AppointmentDTO;
import com.hospital_system.hospital.dto.CancelAppointmentDTO;
import com.hospital_system.hospital.dto.PaymentDTO;
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

    // 1. Book new appointment
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(@RequestBody AppointmentDTO appointmentDTO) {
        try {
            Appointment appointment = appointmentService.bookAppointment(
                    appointmentDTO.getPatientId(),
                    appointmentDTO.getScheduleId(),
                    appointmentDTO.getAppointmentDate(),
                    appointmentDTO.getAppointmentFee()
            );
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Get all appointments
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    // 3. Get appointment by ID
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            Appointment appointment = appointmentService.getAppointmentById(id);
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 4. Update appointment status
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
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

    // 5. Cancel appointment
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
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

    // 6. Mark appointment as paid
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER', 'RECEPTIONIST')")
    @PostMapping("/{id}/payment")
    public ResponseEntity<?> markAsPaid(@PathVariable Long id,
                                        @RequestBody PaymentDTO paymentDTO) {
        try {
            Appointment appointment = appointmentService.markAsPaid(id, paymentDTO.getAmount());
            return ResponseEntity.ok(appointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 7. Reschedule to next available date
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(@PathVariable Long id) {
        try {
            Appointment newAppointment = appointmentService.rescheduleToNextAvailable(id);
            return ResponseEntity.ok(newAppointment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 8. Get appointments by status
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/status/{status}")
    public List<Appointment> getByStatus(@PathVariable AppointmentStatus status) {
        return appointmentService.getAppointmentsByStatus(status);
    }

    // 9. Get today's appointments
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/today")
    public List<Appointment> getTodayAppointments() {
        return appointmentService.getTodayAppointments();
    }

    // 10. Get appointments by patient
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/patient/{patientId}")
    public List<Appointment> getByPatient(@PathVariable Long patientId) {
        return appointmentService.getAppointmentsByPatient(patientId);
    }

    // 11. Get appointments by doctor
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/doctor/{doctorId}")
    public List<Appointment> getByDoctor(@PathVariable Long doctorId) {
        return appointmentService.getAppointmentsByDoctor(doctorId);
    }
}