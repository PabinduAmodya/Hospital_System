package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {

    // Find bills by patient name
    List<Bill> findByPatientName(String patientName);

    // Find bills by payment status
    List<Bill> findByPaid(boolean paid);

    // Find bills by appointment
    List<Bill> findByAppointment(Appointment appointment);

    // Find bills by patient — both appointment bills AND standalone test bills
    @Query("SELECT b FROM Bill b WHERE b.patientId = :patientId")
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

    // Revenue by date range (grouped by date)
    @Query("SELECT CAST(b.paidAt AS LocalDate), SUM(b.totalAmount) FROM Bill b WHERE b.paid = true AND b.paidAt BETWEEN :startDateTime AND :endDateTime GROUP BY CAST(b.paidAt AS LocalDate) ORDER BY CAST(b.paidAt AS LocalDate)")
    List<Object[]> getRevenueByDateRange(@Param("startDateTime") LocalDateTime startDateTime, @Param("endDateTime") LocalDateTime endDateTime);

    // Sum revenue since a given date
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paid = true AND b.paidAt >= :since")
    BigDecimal sumRevenueSince(@Param("since") LocalDateTime since);

    // Monthly revenue trend
    @Query("SELECT MONTH(b.paidAt), YEAR(b.paidAt), SUM(b.totalAmount) FROM Bill b WHERE b.paid = true AND b.paidAt >= :since GROUP BY YEAR(b.paidAt), MONTH(b.paidAt) ORDER BY YEAR(b.paidAt), MONTH(b.paidAt)")
    List<Object[]> getMonthlyRevenue(@Param("since") LocalDateTime since);

    // Revenue by doctor (via appointment)
    @Query("SELECT b.appointment.schedule.doctor.id, COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.paid = true AND b.appointment IS NOT NULL GROUP BY b.appointment.schedule.doctor.id")
    List<Object[]> getRevenueByDoctor();

    // Find the latest bill number for a given year
    @Query("SELECT b.billNumber FROM Bill b WHERE b.billNumber LIKE :prefix% ORDER BY b.billNumber DESC")
    List<String> findLatestBillNumberByPrefix(@Param("prefix") String prefix, Pageable pageable);

    // Sum of due amounts
    @Query("SELECT COALESCE(SUM(b.dueAmount), 0) FROM Bill b WHERE b.dueAmount > 0")
    BigDecimal sumTotalDue();

    // Find bills with outstanding balance
    @Query("SELECT b FROM Bill b WHERE b.dueAmount > 0 ORDER BY b.createdAt DESC")
    List<Bill> findBillsWithDue();

    // Find by bill number
    Optional<Bill> findByBillNumber(String billNumber);

    // Find by payment status
    List<Bill> findByPaymentStatus(String paymentStatus);
}