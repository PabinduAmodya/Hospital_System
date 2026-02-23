package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.entity.Payment;
import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.enums.PaymentStatus;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.exception.BadRequestException;
import com.hospital_system.hospital.repository.BillRepository;
import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    public Payment createPayment(Payment payment) {
        if (payment.getBill() == null || payment.getBill().getId() == null) {
            throw new BadRequestException("Bill id is required for payment");
        }

        Long billId = payment.getBill().getId();
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found: " + billId));

        if (bill.isPaid()) {
            throw new BadRequestException("Bill is already paid");
        }

        if (payment.getAmountPaid() == null) {
            throw new BadRequestException("amountPaid is required");
        }

        // Integrity: prevent paying more than bill total (and partial payments are not supported in this model)
        int cmp = payment.getAmountPaid().compareTo(bill.getTotalAmount());
        if (cmp > 0) {
            throw new BadRequestException("Payment exceeds bill total amount");
        }
        if (cmp < 0) {
            throw new BadRequestException("Partial payments are not supported. Amount must equal bill total");
        }

        payment.setBill(bill);

        // Mark bill as paid
        bill.setPaid(true);
        billRepository.save(bill);

        // Update appointment payment fields if bill is linked to an appointment
        if (bill.getAppointment() != null) {
            var appt = bill.getAppointment();
            appt.setPaidAmount(payment.getAmountPaid());
            appt.setPaymentStatus(PaymentStatus.PAID);
            appt.setStatus(AppointmentStatus.PAID);
            appt.setPaidAt(java.time.LocalDateTime.now());
            appointmentRepository.save(appt);
        }

        return paymentRepository.save(payment);
    }

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
