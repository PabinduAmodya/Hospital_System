package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/appointment/{appointmentId}")
    public Bill createAppointmentBill(@PathVariable Long appointmentId) {
        return billService.createAppointmentBill(appointmentId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/add-test/{testId}")
    public Bill addMedicalTest(@PathVariable Long billId, @PathVariable Long testId) {
        return billService.addMedicalTestToBill(billId, testId);
    }

    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }
}
