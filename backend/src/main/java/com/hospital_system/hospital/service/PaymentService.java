package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Payment;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * PaymentService only reads and deletes payment records.
 * Payment creation is handled exclusively by BillService.markBillAsPaid()
 * to ensure Bill, Appointment, and Payment stay in sync.
 */
@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + id));
    }

    public void delete(Long id) {
        if (!paymentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Payment not found: " + id);
        }
        paymentRepository.deleteById(id);
    }
}
