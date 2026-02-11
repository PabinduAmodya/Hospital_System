package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BillItemRepository extends JpaRepository<BillItem, Long> {
}
