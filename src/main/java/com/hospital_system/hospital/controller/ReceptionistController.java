package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Receptionist;
import com.hospital_system.hospital.service.ReceptionistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/receptionist")
public class ReceptionistController {

    @Autowired
    private ReceptionistService receptionistService;

    // Get all receptionists
    @GetMapping("/all")
    public Iterable<Receptionist> getAll() {
        return receptionistService.getAllReceptionists();
    }

    // Add new receptionist
    @PostMapping("/add")
    public Receptionist add(@RequestBody Receptionist receptionist) {
        return receptionistService.saveReceptionist(receptionist);
    }

    // Delete receptionist
    @DeleteMapping("/delete/{id}")
    public String delete(@PathVariable Long id) {
        receptionistService.deleteReceptionist(id);
        return "Receptionist deleted!";
    }

    // Login receptionist
    @PostMapping("/login")
    public String login(@RequestParam String username, @RequestParam String password) {
        Optional<Receptionist> rec = receptionistService.findByUsername(username);
        if(rec.isPresent() && rec.get().getPassword().equals(password)) {
            return "Login Success";
        }
        return "Invalid username or password";
    }
}