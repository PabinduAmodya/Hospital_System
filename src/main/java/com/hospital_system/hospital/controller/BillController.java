package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.MakePaymentDTO;
import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    // Create bill for appointment
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER', 'RECEPTIONIST')")
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> createAppointmentBill(@PathVariable Long appointmentId) {
        try {
            Bill bill = billService.createAppointmentBill(appointmentId);
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Add medical test to existing bill
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER', 'RECEPTIONIST')")
    @PostMapping("/{billId}/add-test/{testId}")
    public ResponseEntity<?> addMedicalTest(@PathVariable Long billId, @PathVariable Long testId) {
        try {
            Bill bill = billService.addMedicalTestToBill(billId, testId);
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get all bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    // Get bill by ID
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER', 'RECEPTIONIST')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id) {
        try {
            Bill bill = billService.getBillById(id);
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get bills by patient name
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER', 'RECEPTIONIST')")
    @GetMapping("/patient/{patientName}")
    public List<Bill> getBillsByPatient(@PathVariable String patientName) {
        return billService.getBillsByPatientName(patientName);
    }

    // Get unpaid bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping("/unpaid")
    public List<Bill> getUnpaidBills() {
        return billService.getUnpaidBills();
    }

    // Mark bill as paid
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/pay")
    public ResponseEntity<?> markAsPaid(@PathVariable Long billId,
                                        @RequestBody MakePaymentDTO paymentDTO) {
        try {
            Bill bill = billService.markBillAsPaid(billId, paymentDTO.getPaymentMethod());
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Delete bill
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable Long id) {
        try {
            billService.deleteBill(id);
            return ResponseEntity.ok("Bill deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}