package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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

    @Autowired
    private PaymentRepository paymentRepository;

    // Hospital charge constant
    private static final BigDecimal HOSPITAL_CHARGE = new BigDecimal("750.00");

    // Create bill for appointment - UPDATED: Shows breakdown of fees
    @Transactional
    public Bill createAppointmentBill(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Check if bill already exists for this appointment
        List<Bill> existingBills = billRepository.findByAppointment(appointment);
        if (!existingBills.isEmpty()) {
            throw new RuntimeException("Bill already exists for this appointment");
        }

        Bill bill = new Bill(
                appointment.getPatient().getName(),
                appointment
        );

        bill = billRepository.save(bill);

        // Calculate doctor's channeling fee (Total - Hospital Charge)
        BigDecimal totalFee = appointment.getAppointmentFee();
        BigDecimal doctorChannelingFee = totalFee.subtract(HOSPITAL_CHARGE);

        // Add Doctor Channeling Fee as separate bill item
        BillItem channelingItem = new BillItem(
                "Doctor Channeling Fee - " + appointment.getSchedule().getDoctor().getName(),
                "DOCTOR_FEE",
                doctorChannelingFee,
                bill
        );
        billItemRepository.save(channelingItem);

        // Add Hospital Charge as separate bill item
        BillItem hospitalChargeItem = new BillItem(
                "Hospital Charge",
                "HOSPITAL_FEE",
                HOSPITAL_CHARGE,
                bill
        );
        billItemRepository.save(hospitalChargeItem);

        // Set total amount
        bill.setTotalAmount(totalFee);
        return billRepository.save(bill);
    }

    // Add medical test to existing bill
    @Transactional
    public Bill addMedicalTestToBill(Long billId, Long testId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        MedicalTest test = medicalTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Medical test not found"));

        if (!test.isActive()) {
            throw new RuntimeException("Medical test is not active");
        }

        // Check if test already added to this bill
        List<BillItem> existingItems = billItemRepository.findByBill(bill);
        boolean testAlreadyAdded = existingItems.stream()
                .anyMatch(item -> item.getItemName().contains(test.getName()));

        if (testAlreadyAdded) {
            throw new RuntimeException("This test has already been added to the bill");
        }

        BillItem testItem = new BillItem(
                test.getName(),
                test.getType().name(),
                test.getPrice(),
                bill
        );

        billItemRepository.save(testItem);

        // Update total amount
        bill.setTotalAmount(
                bill.getTotalAmount().add(test.getPrice())
        );

        return billRepository.save(bill);
    }

    // Get all bills
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    // Get bill by ID
    public Bill getBillById(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with ID: " + id));
    }

    // Get bills by patient name
    public List<Bill> getBillsByPatientName(String patientName) {
        return billRepository.findByPatientName(patientName);
    }

    // Get unpaid bills
    public List<Bill> getUnpaidBills() {
        return billRepository.findByPaid(false);
    }

    // Get paid bills
    public List<Bill> getPaidBills() {
        return billRepository.findByPaid(true);
    }

    // Mark bill as paid
    @Transactional
    public Bill markBillAsPaid(Long billId, String paymentMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid()) {
            throw new RuntimeException("Bill is already paid");
        }

        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            paymentMethod = "CASH"; // Default payment method
        }

        bill.setPaid(true);

        // Create payment record
        Payment payment = new Payment(
                bill,
                bill.getTotalAmount(),
                paymentMethod
        );
        paymentRepository.save(payment);

        return billRepository.save(bill);
    }

    // Remove medical test from bill
    @Transactional
    public Bill removeMedicalTestFromBill(Long billId, Long billItemId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid()) {
            throw new RuntimeException("Cannot modify a paid bill");
        }

        BillItem item = billItemRepository.findById(billItemId)
                .orElseThrow(() -> new RuntimeException("Bill item not found"));

        if (!item.getBill().getId().equals(billId)) {
            throw new RuntimeException("Bill item does not belong to this bill");
        }

        // Cannot remove doctor fee or hospital charge
        if (item.getItemType().equals("DOCTOR_FEE") || item.getItemType().equals("HOSPITAL_FEE")) {
            throw new RuntimeException("Cannot remove doctor fee or hospital charge from bill");
        }

        // Subtract item price from total
        bill.setTotalAmount(
                bill.getTotalAmount().subtract(item.getPrice())
        );

        billItemRepository.delete(item);

        return billRepository.save(bill);
    }

    // Delete bill (only if unpaid)
    @Transactional
    public void deleteBill(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid()) {
            throw new RuntimeException("Cannot delete a paid bill");
        }

        billRepository.delete(bill);
    }

    // Get total revenue from paid bills
    public BigDecimal getTotalRevenue() {
        List<Bill> paidBills = billRepository.findByPaid(true);
        return paidBills.stream()
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Get pending amount (unpaid bills)
    public BigDecimal getPendingAmount() {
        List<Bill> unpaidBills = billRepository.findByPaid(false);
        return unpaidBills.stream()
                .map(Bill::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}