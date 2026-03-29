package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.enums.PaymentStatus;
import com.hospital_system.hospital.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private SystemSettingService settingService;

    @Autowired
    private AuditLogService auditLogService;

    // ────────────────────────────────────────────────────────────────────────────
    //  Helpers
    // ────────────────────────────────────────────────────────────────────────────

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    private String generateBillNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "BILL-" + year + "-";
        List<String> latest = billRepository.findLatestBillNumberByPrefix(prefix,
                PageRequest.of(0, 1));
        int nextNum = 1;
        if (!latest.isEmpty()) {
            String lastNum = latest.get(0).substring(prefix.length());
            nextNum = Integer.parseInt(lastNum) + 1;
        }
        return prefix + String.format("%05d", nextNum);
    }

    private void recalculateBillTotals(Bill bill) {
        // Sum all item totals
        List<BillItem> items = billItemRepository.findByBill(bill);
        BigDecimal subTotal = items.stream()
                .map(i -> i.getTotalPrice() != null ? i.getTotalPrice() : i.getPrice())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        bill.setSubTotal(subTotal);

        // Apply discount
        BigDecimal discountAmount = bill.getDiscountAmount() != null ? bill.getDiscountAmount() : BigDecimal.ZERO;
        if (bill.getDiscountPercentage() != null && bill.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = subTotal.multiply(bill.getDiscountPercentage())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            bill.setDiscountAmount(discountAmount);
        }

        BigDecimal netAmount = subTotal.subtract(discountAmount);
        if (netAmount.compareTo(BigDecimal.ZERO) < 0) netAmount = BigDecimal.ZERO;
        bill.setNetAmount(netAmount);

        // Apply tax
        BigDecimal taxRate = bill.getTaxPercentage() != null ? bill.getTaxPercentage() : BigDecimal.ZERO;
        BigDecimal taxAmount = netAmount.multiply(taxRate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        bill.setTaxAmount(taxAmount);

        // Total = net + tax
        BigDecimal totalAmount = netAmount.add(taxAmount);
        bill.setTotalAmount(totalAmount);

        // Due = total - paid - insurance
        BigDecimal paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal insurance = bill.getInsuranceCoverage() != null ? bill.getInsuranceCoverage() : BigDecimal.ZERO;
        BigDecimal due = totalAmount.subtract(paid).subtract(insurance);
        if (due.compareTo(BigDecimal.ZERO) < 0) due = BigDecimal.ZERO;
        bill.setDueAmount(due);

        // Update payment status
        if (bill.isRefunded()) {
            bill.setPaymentStatus("REFUNDED");
        } else if (due.compareTo(BigDecimal.ZERO) == 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            bill.setPaymentStatus("PAID");
            if (!bill.isPaid()) {
                bill.setPaid(true);
                bill.setPaidAt(LocalDateTime.now());
            }
        } else if (paid.compareTo(BigDecimal.ZERO) > 0) {
            bill.setPaymentStatus("PARTIAL");
        } else {
            bill.setPaymentStatus("UNPAID");
        }
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Create bill for appointment
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill createAppointmentBill(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Only create a bill for CONFIRMED or COMPLETED appointments
        switch (appointment.getStatus()) {
            case CANCELLED:
                throw new RuntimeException("Cannot create a bill for a cancelled appointment");
            case RESCHEDULED:
                throw new RuntimeException("Cannot create a bill for a rescheduled appointment — bill the new appointment instead");
            default:
                break;
        }

        List<Bill> existingBills = billRepository.findByAppointment(appointment);
        if (!existingBills.isEmpty()) {
            throw new RuntimeException("A bill already exists for this appointment (Bill ID: " + existingBills.get(0).getId() + ")");
        }

        Bill bill = new Bill(appointment.getPatient().getName(), appointment);
        bill.setPatientId(appointment.getPatient().getId());
        bill.setBillType("APPOINTMENT");
        bill.setBillNumber(generateBillNumber());
        bill.setCreatedBy(getCurrentUser());
        bill.setTaxPercentage(settingService.getTaxRate());
        bill = billRepository.save(bill);

        BigDecimal totalFee = appointment.getAppointmentFee();
        BigDecimal hospitalCharge = settingService.getHospitalCharge();
        BigDecimal doctorChannelingFee = totalFee.subtract(hospitalCharge);

        BillItem channelingItem = new BillItem(
                "Doctor Channeling Fee - " + appointment.getSchedule().getDoctor().getName(),
                "DOCTOR_FEE",
                doctorChannelingFee,
                bill
        );
        channelingItem.setUnitPrice(doctorChannelingFee);
        channelingItem.setQuantity(1);
        channelingItem.setTotalPrice(doctorChannelingFee);
        billItemRepository.save(channelingItem);

        BillItem hospitalChargeItem = new BillItem(
                "Hospital Charge",
                "HOSPITAL_FEE",
                hospitalCharge,
                bill
        );
        hospitalChargeItem.setUnitPrice(hospitalCharge);
        hospitalChargeItem.setQuantity(1);
        hospitalChargeItem.setTotalPrice(hospitalCharge);
        billItemRepository.save(hospitalChargeItem);

        recalculateBillTotals(bill);
        Bill saved = billRepository.save(bill);

        try {
            auditLogService.log("CREATE", "BILL", saved.getId(),
                    "Created appointment bill " + saved.getBillNumber() + " for patient " + saved.getPatientName() + ", amount: " + saved.getTotalAmount());
        } catch (Exception e) { /* audit log should never break main flow */ }

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Add / remove medical test from a bill
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill addMedicalTestToBill(Long billId, Long testId) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid()) {
            throw new RuntimeException("Cannot modify a paid bill");
        }

        MedicalTest test = medicalTestRepository.findById(testId)
                .orElseThrow(() -> new RuntimeException("Medical test not found"));

        if (!test.isActive()) {
            throw new RuntimeException("Medical test is not active");
        }

        List<BillItem> existingItems = billItemRepository.findByBill(bill);
        boolean testAlreadyAdded = existingItems.stream()
                .anyMatch(item -> item.getItemName().equalsIgnoreCase(test.getName()));

        if (testAlreadyAdded) {
            throw new RuntimeException("This test has already been added to the bill");
        }

        BillItem testItem = new BillItem(
                test.getName(),
                test.getType().name(),
                test.getPrice(),
                bill
        );
        testItem.setUnitPrice(test.getPrice());
        testItem.setQuantity(1);
        testItem.setTotalPrice(test.getPrice());
        billItemRepository.save(testItem);

        recalculateBillTotals(bill);
        return billRepository.save(bill);
    }

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

        if (item.getItemType().equals("DOCTOR_FEE") || item.getItemType().equals("HOSPITAL_FEE")) {
            throw new RuntimeException("Cannot remove doctor fee or hospital charge from bill");
        }

        billItemRepository.delete(item);

        recalculateBillTotals(bill);
        return billRepository.save(bill);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Apply discount
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill applyDiscount(Long billId, BigDecimal amount, BigDecimal percentage, String reason) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid() || "PAID".equals(bill.getPaymentStatus())) {
            throw new RuntimeException("Cannot apply discount to a paid bill");
        }

        if (amount != null) {
            bill.setDiscountAmount(amount);
        }
        if (percentage != null) {
            bill.setDiscountPercentage(percentage);
        }
        if (reason != null) {
            bill.setDiscountReason(reason);
        }

        recalculateBillTotals(bill);
        Bill saved = billRepository.save(bill);

        try {
            auditLogService.log("DISCOUNT", "BILL", billId,
                    "Applied discount to bill " + saved.getBillNumber() + ". Amount: " + saved.getDiscountAmount()
                            + ", Percentage: " + percentage + ", Reason: " + reason);
        } catch (Exception e) { /* audit log should never break main flow */ }

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Apply insurance
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill applyInsurance(Long billId, String provider, String policyNumber, BigDecimal coverage) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid() || "PAID".equals(bill.getPaymentStatus())) {
            throw new RuntimeException("Cannot apply insurance to a paid bill");
        }

        if (provider != null) {
            bill.setInsuranceProvider(provider);
        }
        if (policyNumber != null) {
            bill.setInsurancePolicyNumber(policyNumber);
        }
        if (coverage != null) {
            bill.setInsuranceCoverage(coverage);
        }

        recalculateBillTotals(bill);
        Bill saved = billRepository.save(bill);

        try {
            auditLogService.log("INSURANCE", "BILL", billId,
                    "Applied insurance to bill " + saved.getBillNumber() + ". Provider: " + provider
                            + ", Policy: " + policyNumber + ", Coverage: " + coverage);
        } catch (Exception e) { /* audit log should never break main flow */ }

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Payment — supports partial and full payments
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill makePayment(Long billId, BigDecimal amount, String paymentMethod, String paidByUser) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isRefunded()) {
            throw new RuntimeException("Cannot make payment on a refunded bill");
        }
        if ("PAID".equals(bill.getPaymentStatus())) {
            throw new RuntimeException("Bill is already fully paid");
        }

        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            paymentMethod = "CASH";
        }

        // If amount is null or zero, pay the full due amount
        BigDecimal dueAmount = bill.getDueAmount() != null ? bill.getDueAmount() : bill.getTotalAmount();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            amount = dueAmount;
        }

        LocalDateTime now = LocalDateTime.now();

        // Create payment record
        Payment payment = new Payment(bill, amount, paymentMethod);
        payment.setPaidAt(now);
        paymentRepository.save(payment);

        // Update bill paid amount
        BigDecimal currentPaid = bill.getPaidAmount() != null ? bill.getPaidAmount() : BigDecimal.ZERO;
        bill.setPaidAmount(currentPaid.add(amount));
        bill.setPaymentMethod(paymentMethod);
        if (paidByUser != null && !paidByUser.trim().isEmpty()) {
            bill.setPaidBy(paidByUser);
        } else {
            bill.setPaidBy(getCurrentUser());
        }

        recalculateBillTotals(bill);
        billRepository.save(bill);

        // Sync appointment payment fields if linked
        if (bill.getAppointment() != null) {
            Appointment appt = bill.getAppointment();
            appt.setPaidAmount(bill.getPaidAmount());
            if ("PAID".equals(bill.getPaymentStatus())) {
                appt.setPaymentStatus(PaymentStatus.PAID);
                appt.setPaidAt(now);
            } else if ("PARTIAL".equals(bill.getPaymentStatus())) {
                appt.setPaymentStatus(PaymentStatus.PARTIAL);
            }
            appointmentRepository.save(appt);
        }

        try {
            auditLogService.log("PAYMENT", "BILL", billId,
                    "Payment of " + amount + " on bill " + bill.getBillNumber()
                            + ". Method: " + paymentMethod + ", Total paid: " + bill.getPaidAmount()
                            + ", Due: " + bill.getDueAmount());
        } catch (Exception e) { /* audit log should never break main flow */ }

        return bill;
    }

    // Backward-compatible — pays the full remaining amount
    @Transactional
    public Bill markBillAsPaid(Long billId, String paymentMethod) {
        return makePayment(billId, null, paymentMethod, null);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Update bill notes
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill updateBillNotes(Long billId, String notes) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setNotes(notes);
        return billRepository.save(bill);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Create standalone test-only bill
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill createTestOnlyBill(Long patientId, List<Long> testIds) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + patientId));

        if (testIds == null || testIds.isEmpty()) {
            throw new RuntimeException("At least one medical test is required");
        }

        Bill bill = new Bill();
        bill.setPatientName(patient.getName());
        bill.setPatientId(patientId);
        bill.setBillType("TEST_ONLY");
        bill.setTotalAmount(BigDecimal.ZERO);
        bill.setBillNumber(generateBillNumber());
        bill.setCreatedBy(getCurrentUser());
        bill.setTaxPercentage(settingService.getTaxRate());
        bill = billRepository.save(bill);

        List<String> addedNames = new ArrayList<>();
        boolean anyAdded = false;

        for (Long testId : testIds) {
            MedicalTest test = medicalTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Medical test not found: " + testId));
            if (!test.isActive()) continue;
            if (addedNames.contains(test.getName())) continue; // no duplicates
            addedNames.add(test.getName());

            BillItem item = new BillItem(test.getName(), test.getType().name(), test.getPrice(), bill);
            item.setUnitPrice(test.getPrice());
            item.setQuantity(1);
            item.setTotalPrice(test.getPrice());
            billItemRepository.save(item);
            anyAdded = true;
        }

        if (!anyAdded) {
            billRepository.delete(bill);
            throw new RuntimeException("No valid tests were added to the bill");
        }

        recalculateBillTotals(bill);
        Bill savedTestBill = billRepository.save(bill);

        try {
            auditLogService.log("CREATE", "BILL", savedTestBill.getId(),
                    "Created test-only bill " + savedTestBill.getBillNumber() + " for patient ID " + patientId + ", amount: " + savedTestBill.getTotalAmount());
        } catch (Exception e) { /* audit log should never break main flow */ }

        return savedTestBill;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Refund
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Bill processRefund(Long billId, String refundReason, String refundMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (!bill.isPaid()) {
            throw new RuntimeException("Cannot refund an unpaid bill");
        }
        if (bill.isRefunded()) {
            throw new RuntimeException("Bill has already been refunded");
        }

        LocalDateTime now = LocalDateTime.now();

        // Mark bill as refunded
        bill.setRefunded(true);
        bill.setRefundAmount(bill.getTotalAmount());
        bill.setRefundReason(refundReason);
        bill.setRefundMethod(refundMethod != null ? refundMethod : "CASH");
        bill.setRefundedAt(now);
        bill.setPaymentStatus("REFUNDED");
        billRepository.save(bill);

        // Create a refund payment record (negative amount) for reporting
        Payment refundPayment = new Payment(bill, bill.getTotalAmount().negate(), refundMethod != null ? refundMethod : "CASH");
        refundPayment.setRefund(true);
        refundPayment.setRefundReason(refundReason);
        refundPayment.setPaidAt(now);
        paymentRepository.save(refundPayment);

        // Sync appointment payment status to REFUNDED if linked
        if (bill.getAppointment() != null) {
            Appointment appt = bill.getAppointment();
            appt.setPaymentStatus(PaymentStatus.REFUNDED);
            appt.setRefundAmount(bill.getTotalAmount());
            appt.setRefundedAt(now);
            appointmentRepository.save(appt);
        }

        try {
            auditLogService.log("REFUND", "BILL", billId,
                    "Refunded bill " + bill.getBillNumber() + ". Amount: " + bill.getTotalAmount() + ", Reason: " + refundReason);
        } catch (Exception e) { /* audit log should never break main flow */ }

        return bill;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Query methods
    // ────────────────────────────────────────────────────────────────────────────

    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    public Bill getBillById(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found with ID: " + id));
    }

    public List<Bill> getBillsByPatientId(Long patientId) {
        return billRepository.findByPatientId(patientId);
    }

    public List<Bill> getBillsByPatientName(String patientName) {
        return billRepository.findByPatientName(patientName);
    }

    public List<Bill> getUnpaidBills() {
        return billRepository.findByPaid(false);
    }

    public List<Bill> getPaidBills() {
        return billRepository.findByPaid(true);
    }

    public List<Bill> getBillsWithDue() {
        return billRepository.findBillsWithDue();
    }

    public Bill getBillByBillNumber(String billNumber) {
        return billRepository.findByBillNumber(billNumber)
                .orElseThrow(() -> new RuntimeException("Bill not found with number: " + billNumber));
    }

    public List<Bill> getBillsByPaymentStatus(String paymentStatus) {
        return billRepository.findByPaymentStatus(paymentStatus);
    }

    public BigDecimal getTotalRevenue() {
        return billRepository.sumRevenue();
    }

    public BigDecimal getTotalDue() {
        return billRepository.sumTotalDue();
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Delete
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteBill(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (bill.isPaid()) {
            throw new RuntimeException("Cannot delete a paid bill");
        }
        billRepository.delete(bill);
    }
}
