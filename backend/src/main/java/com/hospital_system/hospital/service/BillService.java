package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.enums.PaymentStatus;
import com.hospital_system.hospital.repository.*;
import java.util.List;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import com.hospital_system.hospital.service.SystemSettingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private SystemSettingService settingService;

    // Create bill for appointment — splits fees into line items automatically
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
        billItemRepository.save(channelingItem);

        BillItem hospitalChargeItem = new BillItem(
                "Hospital Charge",
                "HOSPITAL_FEE",
                hospitalCharge,
                bill
        );
        billItemRepository.save(hospitalChargeItem);

        bill.setTotalAmount(totalFee);
        return billRepository.save(bill);
    }

    // Add medical test to an unpaid bill
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
        billItemRepository.save(testItem);

        bill.setTotalAmount(bill.getTotalAmount().add(test.getPrice()));
        return billRepository.save(bill);
    }

    // Remove a medical test bill item from an unpaid bill
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

        bill.setTotalAmount(bill.getTotalAmount().subtract(item.getPrice()));
        billItemRepository.delete(item);
        return billRepository.save(bill);
    }

    // Mark bill as paid — single source of truth for payment
    // Also syncs paymentStatus on the linked appointment
    @Transactional
    public Bill markBillAsPaid(Long billId, String paymentMethod) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found"));

        if (bill.isPaid()) {
            throw new RuntimeException("Bill is already paid");
        }

        if (paymentMethod == null || paymentMethod.trim().isEmpty()) {
            paymentMethod = "CASH";
        }

        LocalDateTime now = LocalDateTime.now();

        bill.setPaid(true);
        bill.setPaidAt(now);
        bill.setPaymentMethod(paymentMethod);
        billRepository.save(bill);

        // Create payment record
        Payment payment = new Payment(bill, bill.getTotalAmount(), paymentMethod);
        paymentRepository.save(payment);

        // Sync appointment payment fields — appointment status is NOT changed here,
        // only the paymentStatus field is updated so lifecycle and payment are separate
        if (bill.getAppointment() != null) {
            Appointment appt = bill.getAppointment();
            appt.setPaidAmount(bill.getTotalAmount());
            appt.setPaymentStatus(PaymentStatus.PAID);
            appt.setPaidAt(now);
            appointmentRepository.save(appt);
        }

        return bill;
    }

    // Create a standalone test-only bill for a patient (no appointment needed)
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
        bill = billRepository.save(bill);

        BigDecimal total = BigDecimal.ZERO;
        List<String> addedNames = new ArrayList<>();

        for (Long testId : testIds) {
            MedicalTest test = medicalTestRepository.findById(testId)
                    .orElseThrow(() -> new RuntimeException("Medical test not found: " + testId));
            if (!test.isActive()) continue;
            if (addedNames.contains(test.getName())) continue; // no duplicates
            addedNames.add(test.getName());

            BillItem item = new BillItem(test.getName(), test.getType().name(), test.getPrice(), bill);
            billItemRepository.save(item);
            total = total.add(test.getPrice());
        }

        if (total.compareTo(BigDecimal.ZERO) == 0) {
            billRepository.delete(bill);
            throw new RuntimeException("No valid tests were added to the bill");
        }

        bill.setTotalAmount(total);
        return billRepository.save(bill);
    }

    // Queries
    public List<Bill> getAllBills() { return billRepository.findAll(); }

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

    public List<Bill> getUnpaidBills() { return billRepository.findByPaid(false); }

    public List<Bill> getPaidBills() { return billRepository.findByPaid(true); }

    @Transactional
    public void deleteBill(Long id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        if (bill.isPaid()) {
            throw new RuntimeException("Cannot delete a paid bill");
        }
        billRepository.delete(bill);
    }

    public BigDecimal getTotalRevenue() {
        return billRepository.sumRevenue();
    }
}