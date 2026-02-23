package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Find bills by patient name
    List<Bill> findByPatientName(String patientName);

    // Find bills by payment status
    List<Bill> findByPaid(boolean paid);

    // Find bills by appointment
    List<Bill> findByAppointment(Appointment appointment);

    // Find bills by patient (via appointment -> patient)
    @Query("SELECT b FROM Bill b WHERE b.appointment.patient.id = :patientId")
    List<Bill> findByPatientId(@Param("patientId") Long patientId);

    // Total revenue from paid bills
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paid = true")
    BigDecimal sumRevenue();

    // Count pending (unpaid) bills
    @Query("SELECT COUNT(b) FROM Bill b WHERE b.paid = false")
    long countPending();

    // Find bill by appointment id
    @Query("SELECT b FROM Bill b WHERE b.appointment.id = :appointmentId")
    List<Bill> findByAppointmentId(@Param("appointmentId") Long appointmentId);

}
