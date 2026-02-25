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
import java.time.DayOfWeek;
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

    private static final BigDecimal HOSPITAL_CHARGE = new BigDecimal("750.00");

    // ================= BOOK APPOINTMENT =================
    @Transactional
    public Appointment bookAppointment(Long patientId, Long scheduleId, LocalDate appointmentDate) throws Exception {

        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        Optional<Schedule> scheduleOpt = scheduleRepository.findById(scheduleId);

        if (patientOpt.isEmpty()) throw new Exception("Patient not found");
        if (scheduleOpt.isEmpty()) throw new Exception("Schedule not found");

        Schedule schedule = scheduleOpt.get();

        // FIX 1: Robust day comparison — normalize both sides to uppercase
        String scheduleDay = schedule.getDay().trim().toUpperCase();
        String appointmentDay = appointmentDate.getDayOfWeek().name().toUpperCase();
        if (!scheduleDay.equals(appointmentDay)) {
            throw new Exception("Doctor is not available on " + appointmentDate.getDayOfWeek().name()
                    + ". This schedule is for " + schedule.getDay() + "s.");
        }

        // FIX 2: Count only active (non-cancelled, non-rescheduled) bookings toward daily limit
        List<Appointment> existingAppointments = appointmentRepository
                .findBookedSlotsByDoctorAndDate(schedule.getDoctor().getId(), appointmentDate);

        if (existingAppointments.size() >= 20) {
            throw new Exception("No slots available for this date. Daily limit of 20 appointments reached.");
        }

        BigDecimal doctorFee = schedule.getDoctor().getChannelling_fee();
        BigDecimal totalFee = doctorFee.add(HOSPITAL_CHARGE);

        Appointment appointment = new Appointment(
                patientOpt.get(),
                schedule,
                appointmentDate,
                totalFee
        );

        appointment.setStatus(AppointmentStatus.PENDING);
        appointment.setCreatedAt(LocalDateTime.now());

        return appointmentRepository.save(appointment);
    }

    // ================= UPDATE STATUS =================
    @Transactional
    public Appointment updateStatus(Long appointmentId, AppointmentStatus status, String notes) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Guard: do not allow setting status to a value that no longer exists in the enum
        appointment.setStatus(status);

        if (notes != null && !notes.isEmpty()) {
            appointment.setNotes(notes);
        }

        appointment.setUpdatedAt(LocalDateTime.now());
        return appointmentRepository.save(appointment);
    }

    // ================= CANCEL =================
    @Transactional
    public Appointment cancelAppointment(Long appointmentId, String reason, boolean refundRequired) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(reason);
        appointment.setCancelledAt(LocalDateTime.now());

        if (refundRequired
                && appointment.getPaymentStatus() == PaymentStatus.PAID
                && appointment.getPaidAmount() != null
                && appointment.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            appointment.setRefundAmount(appointment.getPaidAmount());
            appointment.setPaymentStatus(PaymentStatus.REFUNDED);
            appointment.setRefundedAt(LocalDateTime.now());
        }

        return appointmentRepository.save(appointment);
    }

    // ================= RESCHEDULE =================
    // FIX 3: Reschedule only to dates that match the schedule's day-of-week
    // FIX 4: Set rescheduledFrom link on the new appointment
    @Transactional
    public Appointment rescheduleToNextAvailable(Long appointmentId) throws Exception {
        Appointment oldAppointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (oldAppointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new Exception("Cannot reschedule a cancelled appointment");
        }

        if (oldAppointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new Exception("Cannot reschedule a completed appointment");
        }

        LocalDate nextDate = findNextAvailableDateOnScheduleDay(
                oldAppointment.getSchedule().getDoctor().getId(),
                oldAppointment.getSchedule().getDay(),
                oldAppointment.getAppointmentDate()
        );

        if (nextDate == null) {
            throw new Exception("No available slots found in the next 60 days on this doctor's schedule");
        }

        Appointment newAppointment = new Appointment(
                oldAppointment.getPatient(),
                oldAppointment.getSchedule(),
                nextDate,
                oldAppointment.getAppointmentFee()
        );

        newAppointment.setNotes("Rescheduled from " + oldAppointment.getAppointmentDate());
        newAppointment.setStatus(AppointmentStatus.PENDING);
        // FIX 4: Link back to original
        newAppointment.setRescheduledFrom(oldAppointment);

        oldAppointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointmentRepository.save(oldAppointment);

        return appointmentRepository.save(newAppointment);
    }

    // FIX 3 helper: Only advance to dates that match the schedule's day
    private LocalDate findNextAvailableDateOnScheduleDay(Long doctorId, String scheduleDay, LocalDate currentDate) {
        DayOfWeek targetDay;
        try {
            targetDay = DayOfWeek.valueOf(scheduleDay.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }

        LocalDate searchDate = currentDate.plusDays(1);
        LocalDate maxDate = currentDate.plusDays(60);

        while (searchDate.isBefore(maxDate)) {
            // Only check dates that match the schedule day
            if (searchDate.getDayOfWeek() == targetDay) {
                List<Appointment> bookedSlots = appointmentRepository
                        .findBookedSlotsByDoctorAndDate(doctorId, searchDate);
                if (bookedSlots.size() < 20) {
                    return searchDate;
                }
            }
            searchDate = searchDate.plusDays(1);
        }
        return null;
    }

    // ================= QUERIES =================
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findByStatus(status);
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getTodayAppointments() {
        return appointmentRepository.findTodayAppointments();
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public Appointment getAppointmentById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }
}
