package com.hospital_system.hospital.repository;

import com.hospital_system.hospital.entity.Cashier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CashierRepository extends JpaRepository<Cashier, Long> {
    Optional<Cashier> findByUsername(String username);
}