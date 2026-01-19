package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.AdminLoginDTO;
import com.hospital_system.hospital.entity.Admin;
import com.hospital_system.hospital.entity.Cashier;
import com.hospital_system.hospital.service.AdminService;
import com.hospital_system.hospital.service.CashierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private CashierService cashierService;

    // Admin login
    @PostMapping("/login")
    public String login(@RequestBody AdminLoginDTO loginDTO) {
        Admin admin = adminService.findByUsername(loginDTO.getUsername());
        if (admin != null && admin.getPassword().equals(loginDTO.getPassword())) {
            return "Admin login success!";
        }
        return "Invalid credentials";
    }
    // Add new cashier
    @PostMapping("/add-cashier")
    public Cashier addCashier(@RequestBody Cashier cashier) {
        return cashierService.saveCashier(cashier);
    }

    // Get all cashiers
    @GetMapping("/cashiers")
    public List<Cashier> getAllCashiers() {
        return (List<Cashier>) cashierService.getAllCashiers();
    }

    // Delete cashier
    @DeleteMapping("/delete-cashier/{id}")
    public String deleteCashier(@PathVariable Long id) {
        cashierService.deleteCashier(id);
        return "Cashier deleted!";
    }
}