package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.PrescriptionItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionItemRepository extends JpaRepository<PrescriptionItem, Long> {
    List<PrescriptionItem> findByConsultationId(Long consultationId);
    void deleteByConsultationId(Long consultationId);
}
