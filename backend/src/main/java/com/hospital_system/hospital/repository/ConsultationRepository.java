package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {

    Optional<Consultation> findByConsultationNumber(String consultationNumber);

    List<Consultation> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<Consultation> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<Consultation> findByDoctorIdAndConsultationDate(Long doctorId, LocalDate date);

    List<Consultation> findByDoctorIdAndStatus(Long doctorId, String status);

    List<Consultation> findByAppointmentId(Long appointmentId);

    @Query("SELECT c FROM Consultation c WHERE c.doctor.id = :doctorId AND c.consultationDate = :date ORDER BY c.createdAt DESC")
    List<Consultation> findTodayByDoctor(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.doctor.id = :doctorId AND c.status = 'COMPLETED'")
    long countCompletedByDoctor(@Param("doctorId") Long doctorId);

    @Query("SELECT COUNT(c) FROM Consultation c WHERE c.doctor.id = :doctorId AND c.consultationDate = :date")
    long countTodayByDoctor(@Param("doctorId") Long doctorId, @Param("date") LocalDate date);

    @Query("SELECT c FROM Consultation c WHERE c.doctor.id = :doctorId ORDER BY c.createdAt DESC")
    List<Consultation> findRecentByDoctor(@Param("doctorId") Long doctorId, org.springframework.data.domain.Pageable pageable);

    // Find consultation numbers for auto-generation
    @Query("SELECT c.consultationNumber FROM Consultation c WHERE c.consultationNumber LIKE :prefix% ORDER BY c.consultationNumber DESC")
    List<String> findLatestConsultationNumberByPrefix(@Param("prefix") String prefix, org.springframework.data.domain.Pageable pageable);
}
