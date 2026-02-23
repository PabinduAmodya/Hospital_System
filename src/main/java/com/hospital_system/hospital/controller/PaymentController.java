package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Payment;
import com.hospital_system.hospital.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    // CREATE
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @PostMapping("/create")
    public Payment createPayment(@Valid @RequestBody Payment payment) {
        return paymentService.createPayment(payment);
    }

    // READ all
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @GetMapping("/all")
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    // READ one (new)
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @GetMapping("/{id}")
    public Payment getPaymentById(@PathVariable Long id) {
        return paymentService.getById(id);
    }

    // DELETE (new)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deletePayment(@PathVariable Long id) {
        paymentService.delete(id);
        return "Payment deleted";
    }
}
