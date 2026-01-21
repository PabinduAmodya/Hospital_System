package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bill")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @PostMapping("/create")
    public Bill createBill(@RequestBody Bill bill) {
        return billService.createBill(bill);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @GetMapping("/all")
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/delete/{id}")
    public String deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return "Bill deleted!";
    }
}