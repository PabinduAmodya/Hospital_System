package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.repository.BillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    public Bill createBill(Bill bill) {
        return billRepository.save(bill);
    }

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    public void deleteBill(Long id) {
        billRepository.deleteById(id);
    }
}