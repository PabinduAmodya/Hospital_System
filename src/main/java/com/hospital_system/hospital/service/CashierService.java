package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Cashier;
import com.hospital_system.hospital.repository.CashierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class CashierService {

    @Autowired
    private CashierRepository cashierRepository;

    // Save cashier
    public Cashier saveCashier(Cashier cashier) {
        return cashierRepository.save(cashier);
    }

    // Get all cashiers
    public Iterable<Cashier> getAllCashiers() {
        return cashierRepository.findAll();
    }

    // Find by username
    public Optional<Cashier> findByUsername(String username) {
        return cashierRepository.findByUsername(username);
    }

    // Delete cashier
    public void deleteCashier(Long id) {
        cashierRepository.deleteById(id);
    }
}