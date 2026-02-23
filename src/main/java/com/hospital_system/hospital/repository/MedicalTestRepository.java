package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.MedicalTest;
import com.hospital_system.hospital.enums.TestType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalTestRepository extends JpaRepository<MedicalTest, Long> {

    List<MedicalTest> findByType(TestType type);

    List<MedicalTest> findByActiveTrue();
}
