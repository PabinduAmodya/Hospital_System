package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.MakePaymentDTO;
import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    // Create bill for appointment
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> createAppointmentBill(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(billService.createAppointmentBill(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Add medical test to existing bill
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/{billId}/add-test/{testId}")
    public ResponseEntity<?> addMedicalTest(@PathVariable Long billId, @PathVariable Long testId) {
        try {
            return ResponseEntity.ok(billService.addMedicalTestToBill(billId, testId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Remove a test line item from an unpaid bill
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @DeleteMapping("/{billId}/items/{itemId}")
    public ResponseEntity<?> removeMedicalTest(@PathVariable Long billId, @PathVariable Long itemId) {
        try {
            return ResponseEntity.ok(billService.removeMedicalTestFromBill(billId, itemId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Create standalone test-only bill for a patient
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/patient/{patientId}/tests")
    public ResponseEntity<?> createTestBill(@PathVariable Long patientId,
                                            @RequestBody Map<String, List<Long>> body) {
        try {
            List<Long> testIds = body.get("testIds");
            return ResponseEntity.ok(billService.createTestOnlyBill(patientId, testIds));
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
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(billService.getBillById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get bills by patient ID (reliable — no name collision)
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/patient/{patientId}")
    public List<Bill> getBillsByPatient(@PathVariable Long patientId) {
        return billService.getBillsByPatientId(patientId);
    }

    // Get unpaid bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping("/unpaid")
    public List<Bill> getUnpaidBills() {
        return billService.getUnpaidBills();
    }

    // Mark bill as paid — the single correct payment path
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/pay")
    public ResponseEntity<?> markAsPaid(@PathVariable Long billId,
                                        @RequestBody MakePaymentDTO paymentDTO) {
        try {
            return ResponseEntity.ok(billService.markBillAsPaid(billId, paymentDTO.getPaymentMethod()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Delete bill (admin only, unpaid only)
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