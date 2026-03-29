package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.MakePaymentDTO;
import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bills")
@CrossOrigin(origins = "*")
public class BillController {

    @Autowired
    private BillService billService;

    // ─── Helper ────────────────────────────────────────────────────────

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    // ─── Existing endpoints ────────────────────────────────────────────

    // 1. Create bill for appointment
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> createAppointmentBill(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(billService.createAppointmentBill(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. Add medical test to existing bill
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/{billId}/add-test/{testId}")
    public ResponseEntity<?> addMedicalTest(@PathVariable Long billId, @PathVariable Long testId) {
        try {
            return ResponseEntity.ok(billService.addMedicalTestToBill(billId, testId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Remove a test line item from an unpaid bill
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @DeleteMapping("/{billId}/items/{itemId}")
    public ResponseEntity<?> removeMedicalTest(@PathVariable Long billId, @PathVariable Long itemId) {
        try {
            return ResponseEntity.ok(billService.removeMedicalTestFromBill(billId, itemId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Create standalone test-only bill for a patient
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PostMapping("/patient/{patientId}/tests")
    public ResponseEntity<?> createTestBill(@PathVariable Long patientId,
                                            @RequestBody Map<String, List<Object>> body) {
        try {
            List<Long> testIds = body.get("testIds").stream()
                    .map(o -> ((Number) o).longValue())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(billService.createTestOnlyBill(patientId, testIds));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 5. Get all bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    // 6. Get bill by ID
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getBillById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(billService.getBillById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // 7. Get bills by patient ID
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/patient/{patientId}")
    public List<Bill> getBillsByPatient(@PathVariable Long patientId) {
        return billService.getBillsByPatientId(patientId);
    }

    // 8. Get unpaid bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping("/unpaid")
    public List<Bill> getUnpaidBills() {
        return billService.getUnpaidBills();
    }

    // 9. Mark bill as paid (backward compatibility)
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

    // 10. Delete bill (admin only, unpaid only)
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

    // 11. Process refund for a paid bill
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    @PostMapping("/{billId}/refund")
    public ResponseEntity<?> processRefund(@PathVariable Long billId,
                                           @RequestBody Map<String, String> body) {
        try {
            String reason = body.getOrDefault("reason", "");
            String method = body.getOrDefault("refundMethod", "CASH");
            return ResponseEntity.ok(billService.processRefund(billId, reason, method));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── New endpoints ─────────────────────────────────────────────────

    // 12. Make a payment (partial or full)
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/payment")
    public ResponseEntity<?> makePayment(@PathVariable Long billId,
                                         @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = body.get("amount") != null
                    ? new BigDecimal(body.get("amount").toString())
                    : null;
            String paymentMethod = (String) body.get("paymentMethod");
            return ResponseEntity.ok(billService.makePayment(billId, amount, paymentMethod, getCurrentUser()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 13. Apply discount
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/discount")
    public ResponseEntity<?> applyDiscount(@PathVariable Long billId,
                                           @RequestBody Map<String, Object> body) {
        try {
            BigDecimal amount = body.get("amount") != null
                    ? new BigDecimal(body.get("amount").toString())
                    : null;
            BigDecimal percentage = body.get("percentage") != null
                    ? new BigDecimal(body.get("percentage").toString())
                    : null;
            String reason = (String) body.get("reason");

            if (amount == null && percentage == null) {
                return ResponseEntity.badRequest().body("At least amount or percentage must be provided");
            }

            return ResponseEntity.ok(billService.applyDiscount(billId, amount, percentage, reason));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 14. Apply insurance
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @PostMapping("/{billId}/insurance")
    public ResponseEntity<?> applyInsurance(@PathVariable Long billId,
                                            @RequestBody Map<String, Object> body) {
        try {
            String provider = (String) body.get("provider");
            String policyNumber = (String) body.get("policyNumber");
            BigDecimal coverage = body.get("coverage") != null
                    ? new BigDecimal(body.get("coverage").toString())
                    : null;
            return ResponseEntity.ok(billService.applyInsurance(billId, provider, policyNumber, coverage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 15. Update bill notes
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @PutMapping("/{billId}/notes")
    public ResponseEntity<?> updateBillNotes(@PathVariable Long billId,
                                             @RequestBody Map<String, String> body) {
        try {
            String notes = body.get("notes");
            return ResponseEntity.ok(billService.updateBillNotes(billId, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 16. Get bills with outstanding balance
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping("/due")
    public List<Bill> getBillsWithDue() {
        return billService.getBillsWithDue();
    }

    // 17. Search bills by bill number, patient name, or ID
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/search")
    public ResponseEntity<?> searchBills(@RequestParam("q") String query) {
        try {
            String lowerQuery = query.toLowerCase().trim();
            List<Bill> allBills = billService.getAllBills();
            List<Bill> filtered = allBills.stream()
                    .filter(bill -> {
                        if (bill.getBillNumber() != null &&
                                bill.getBillNumber().toLowerCase().contains(lowerQuery)) {
                            return true;
                        }
                        if (bill.getId() != null &&
                                bill.getId().toString().equals(lowerQuery)) {
                            return true;
                        }
                        // Try patient name search via service
                        return false;
                    })
                    .collect(Collectors.toList());

            // Also include results from patient name search
            try {
                List<Bill> byName = billService.getBillsByPatientName(query);
                for (Bill bill : byName) {
                    if (filtered.stream().noneMatch(b -> b.getId().equals(bill.getId()))) {
                        filtered.add(bill);
                    }
                }
            } catch (Exception ignored) {
                // Patient name search may fail if no matches; that is fine
            }

            return ResponseEntity.ok(filtered);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 18. Get bill by bill number
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER','RECEPTIONIST')")
    @GetMapping("/number/{billNumber}")
    public ResponseEntity<?> getBillByNumber(@PathVariable String billNumber) {
        try {
            return ResponseEntity.ok(billService.getBillByBillNumber(billNumber));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ─── Revenue ───────────────────────────────────────────────────────

    // Get total revenue
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/revenue")
    public ResponseEntity<?> getTotalRevenue() {
        try {
            return ResponseEntity.ok(billService.getTotalRevenue());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get paid bills
    @PreAuthorize("hasAnyRole('ADMIN','CASHIER')")
    @GetMapping("/paid")
    public List<Bill> getPaidBills() {
        return billService.getPaidBills();
    }
}
