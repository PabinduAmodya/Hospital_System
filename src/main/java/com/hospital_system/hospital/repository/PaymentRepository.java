package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p WHERE p.bill.appointment.patient.id = :patientId")
    List<Payment> findByPatientId(@Param("patientId") Long patientId);
}
