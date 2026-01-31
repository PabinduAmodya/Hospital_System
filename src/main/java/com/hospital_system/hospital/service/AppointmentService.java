package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.enums.PaymentStatus;
import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.PatientRepository;
import com.hospital_system.hospital.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;

    // Book new appointment
    @Transactional
    public Appointment bookAppointment(Long patientId, Long scheduleId, LocalDate appointmentDate, BigDecimal fee) throws Exception {
        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        Optional<Schedule> scheduleOpt = scheduleRepository.findById(scheduleId);

        if (patientOpt.isEmpty()) throw new Exception("Patient not found");
        if (scheduleOpt.isEmpty()) throw new Exception("Schedule not found");

        // Check if slot is available
        List<Appointment> existingAppointments = appointmentRepository
                .findByDoctorIdAndDate(scheduleOpt.get().getDoctor().getId(), appointmentDate);

        // Simple check - you can add more complex slot validation
        if (existingAppointments.size() >= 20) { // Max 20 patients per day
            throw new Exception("No slots available for this date");
        }

        Appointment appointment = new Appointment(
                patientOpt.get(),
                scheduleOpt.get(),
                appointmentDate,
                fee
        );

        return appointmentRepository.save(appointment);
    }

    // Update appointment status
    @Transactional
    public Appointment updateStatus(Long appointmentId, AppointmentStatus status, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setStatus(status);
        if (notes != null && !notes.isEmpty()) {
            appointment.setNotes(notes);
        }
        appointment.setUpdatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    // Cancel appointment
    @Transactional
    public Appointment cancelAppointment(Long appointmentId, String reason, boolean refundRequired) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledAt(LocalDateTime.now());

        // Handle refund
        if (refundRequired && appointment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            appointment.setRefundAmount(appointment.getPaidAmount());
            appointment.setPaymentStatus(PaymentStatus.REFUNDED);
            appointment.setRefundedAt(LocalDateTime.now());
        }

        return appointmentRepository.save(appointment);
    }

    // Mark as paid
    @Transactional
    public Appointment markAsPaid(Long appointmentId, BigDecimal amount) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appointment.setPaidAmount(amount);
        appointment.setPaymentStatus(PaymentStatus.PAID);
        appointment.setStatus(AppointmentStatus.PAID);
        appointment.setPaidAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    // Reschedule to next available date
    @Transactional
    public Appointment rescheduleToNextAvailable(Long appointmentId) throws Exception {
        Appointment oldAppointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (oldAppointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new Exception("Cannot reschedule cancelled appointment");
        }

        // Find next available date for same doctor
        LocalDate nextDate = findNextAvailableDate(
                oldAppointment.getSchedule().getDoctor().getId(),
                oldAppointment.getAppointmentDate()
        );

        if (nextDate == null) {
            throw new Exception("No available slots found in next 30 days");
        }

        // Create new appointment
        Appointment newAppointment = new Appointment(
                oldAppointment.getPatient(),
                oldAppointment.getSchedule(),
                nextDate,
                oldAppointment.getAppointmentFee()
        );
        newAppointment.setRescheduledFrom(oldAppointment);
        newAppointment.setNotes("Rescheduled from " + oldAppointment.getAppointmentDate());

        // Update old appointment
        oldAppointment.setStatus(AppointmentStatus.RESCHEDULED);
        oldAppointment.setRescheduledTo(newAppointment);

        appointmentRepository.save(oldAppointment);
        return appointmentRepository.save(newAppointment);
    }

    // Find next available date for doctor
    private LocalDate findNextAvailableDate(Long doctorId, LocalDate currentDate) {
        LocalDate searchDate = currentDate.plusDays(1);
        LocalDate maxDate = currentDate.plusDays(30); // Search within 30 days

        while (searchDate.isBefore(maxDate)) {
            List<Appointment> bookedSlots = appointmentRepository
                    .findBookedSlotsByDoctorAndDate(doctorId, searchDate);

            // If less than 20 appointments, date is available
            if (bookedSlots.size() < 20) {
                return searchDate;
            }

            searchDate = searchDate.plusDays(1);
        }

        return null; // No available slots found
    }

    // Get all appointments
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    // Get appointments by status
    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }

    // Get appointments by patient
    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    // Get today's appointments
    public List<Appointment> getTodayAppointments() {
        return appointmentRepository.findTodayAppointments();
    }

    // Get appointments by doctor
    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    // Get appointment by ID
    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }
}

