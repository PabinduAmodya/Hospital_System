package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillItemRepository extends JpaRepository<BillItem, Long> {

    // Find all items for a specific bill
    List<BillItem> findByBill(Bill bill);

    // Find items by type
    List<BillItem> findByItemType(String itemType);
}