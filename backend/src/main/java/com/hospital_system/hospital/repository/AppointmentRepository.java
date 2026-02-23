package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    // Find by status
    List<Appointment> findByStatus(AppointmentStatus status);

    // Find by patient
    List<Appointment> findByPatientId(Long patientId);

    // Find by date
    List<Appointment> findByAppointmentDate(LocalDate date);

    // Find by date range
    List<Appointment> findByAppointmentDateBetween(LocalDate startDate, LocalDate endDate);

    // Find by doctor (via schedule)
    @Query("SELECT a FROM Appointment a WHERE a.schedule.doctor.id = :doctorId")
    List<Appointment> findByDoctorId(@Param("doctorId") Long doctorId);

    // Find by doctor and date
    @Query("SELECT a FROM Appointment a WHERE a.schedule.doctor.id = :doctorId AND a.appointmentDate = :date")
    List<Appointment> findByDoctorIdAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    // Find available slots for doctor on specific date
    @Query("SELECT a FROM Appointment a WHERE a.schedule.doctor.id = :doctorId " +
            "AND a.appointmentDate = :date " +
            "AND a.status NOT IN ('CANCELLED', 'RESCHEDULED')")
    List<Appointment> findBookedSlotsByDoctorAndDate(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    // Count appointments by status
    long countByStatus(AppointmentStatus status);


    // Conflict check: schedule already booked on date (excluding cancelled/rescheduled)
    @Query("SELECT (COUNT(a) > 0) FROM Appointment a WHERE a.schedule.id = :scheduleId AND a.appointmentDate = :date AND a.status NOT IN ('CANCELLED','RESCHEDULED')")
    boolean existsActiveByScheduleAndDate(@Param("scheduleId") Long scheduleId, @Param("date") LocalDate date);

    // Count today's appointments
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = CURRENT_DATE")
    long countToday();

    // Today's appointments
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = CURRENT_DATE")
    List<Appointment> findTodayAppointments();
}