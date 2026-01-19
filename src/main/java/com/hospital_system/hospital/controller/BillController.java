package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bill")
public class BillController {

    @Autowired
    private BillService billService;

    // Create a new bill
    @PostMapping("/create")
    public Bill createBill(@RequestBody Bill bill) {
        return billService.createBill(bill);
    }

    // Get all bills
    @GetMapping("/all")
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    // Delete a bill
    @DeleteMapping("/delete/{id}")
    public String deleteBill(@PathVariable Long id) {
        billService.deleteBill(id);
        return "Bill deleted!";
    }
}