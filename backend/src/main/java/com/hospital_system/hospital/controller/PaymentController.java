package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Payment;
import com.hospital_system.hospital.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * PaymentController only exposes read and delete.
 * Payments are created via POST /api/bills/{billId}/pay (BillController).
 */
@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @GetMapping("/all")
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deletePayment(@PathVariable Long id) {
        paymentService.delete(id);
        return "Payment deleted";
    }
}