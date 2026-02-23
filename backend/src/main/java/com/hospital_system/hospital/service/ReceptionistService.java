package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Receptionist;
import com.hospital_system.hospital.repository.ReceptionistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ReceptionistService {

    @Autowired
    private ReceptionistRepository receptionistRepository;

    // Save receptionist
    public Receptionist saveReceptionist(Receptionist receptionist) {
        return receptionistRepository.save(receptionist);
    }

    // Get all receptionists
    public Iterable<Receptionist> getAllReceptionists() {
        return receptionistRepository.findAll();
    }

    // Find by username
    public Optional<Receptionist> findByUsername(String username) {
        return receptionistRepository.findByUsername(username);
    }

    // Delete receptionist
    public void deleteReceptionist(Long id) {
        receptionistRepository.deleteById(id);
    }
}