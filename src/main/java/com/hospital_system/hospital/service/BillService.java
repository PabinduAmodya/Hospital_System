package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class BillService {

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private BillItemRepository billItemRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private MedicalTestRepository medicalTestRepository;

    // Create bill for appointment
    public Bill createAppointmentBill(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        Bill bill = new Bill(
                appointment.getPatient().getName(),
                appointment
        );

        bill = billRepository.save(bill);

        BillItem appointmentItem = new BillItem(
                "Doctor Appointment",
                "APPOINTMENT",
                appointment.getAppointmentFee(),
                bill
        );

        billItemRepository.save(appointmentItem);

        bill.setTotalAmount(appointment.getAppointmentFee());
        return billRepository.save(bill);
    }

    // Add medical test to bill
    public Bill addMedicalTestToBill(Long billId, Long testId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        MedicalTest test = medicalTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Test not found"));

        BillItem testItem = new BillItem(
                test.getName(),
                test.getType().name(),
                test.getPrice(),
                bill
        );

        billItemRepository.save(testItem);

        bill.setTotalAmount(
                bill.getTotalAmount().add(test.getPrice())
        );

        return billRepository.save(bill);
    }

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }
}
