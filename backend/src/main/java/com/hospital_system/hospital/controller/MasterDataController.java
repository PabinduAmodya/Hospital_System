package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.service.SystemSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/master")
@CrossOrigin(origins = "*")
public class MasterDataController {

    @Autowired
    private SystemSettingService settingService;

    // ── Specializations ───────────────────────────────────────────────

    @GetMapping("/specializations")
    public List<String> getSpecializations() {
        return settingService.getSpecializations();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/specializations")
    public List<String> setSpecializations(@RequestBody List<String> specializations) {
        settingService.setSpecializations(specializations);
        return settingService.getSpecializations();
    }

    // ── Hospital charge ────────────────────────────────────────────────

    @GetMapping("/hospital-charge")
    public Map<String, Object> getHospitalCharge() {
        return Map.of("amount", settingService.getHospitalCharge());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/hospital-charge")
    public Map<String, Object> setHospitalCharge(@RequestBody Map<String, String> body) {
        try {
            BigDecimal amount = new BigDecimal(body.get("amount"));
            if (amount.compareTo(BigDecimal.ZERO) <= 0)
                return Map.of("error", "Amount must be greater than zero");
            settingService.setHospitalCharge(amount);
            return Map.of("amount", settingService.getHospitalCharge());
        } catch (Exception e) {
            return Map.of("error", "Invalid amount: " + e.getMessage());
        }
    }

    // ── Tax rate ──────────────────────────────────────────────────────

    @GetMapping("/tax-rate")
    public ResponseEntity<?> getTaxRate() {
        return ResponseEntity.ok(Map.of("rate", settingService.getTaxRate()));
    }

    @PutMapping("/tax-rate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setTaxRate(@RequestBody Map<String, Object> body) {
        BigDecimal rate = new BigDecimal(body.get("rate").toString());
        if (rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(new BigDecimal("100")) > 0) {
            return ResponseEntity.badRequest().body("Tax rate must be between 0 and 100");
        }
        settingService.setTaxRate(rate);
        return ResponseEntity.ok(Map.of("rate", rate, "message", "Tax rate updated"));
    }

    // ── Hospital info for receipts ────────────────────────────────────

    @GetMapping("/hospital-info")
    public ResponseEntity<?> getHospitalInfo() {
        Map<String, Object> info = new java.util.HashMap<>();
        info.put("name", settingService.getHospitalName());
        info.put("address", settingService.getHospitalAddress());
        info.put("phone", settingService.getHospitalPhone());
        info.put("email", settingService.getHospitalEmail());
        return ResponseEntity.ok(info);
    }

    @PutMapping("/hospital-info")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setHospitalInfo(@RequestBody Map<String, String> body) {
        if (body.containsKey("name")) settingService.setHospitalName(body.get("name"));
        if (body.containsKey("address")) settingService.setHospitalAddress(body.get("address"));
        if (body.containsKey("phone")) settingService.setHospitalPhone(body.get("phone"));
        if (body.containsKey("email")) settingService.setHospitalEmail(body.get("email"));
        return ResponseEntity.ok(Map.of("message", "Hospital info updated"));
    }

    // ── Discount reasons ──────────────────────────────────────────────

    @GetMapping("/discount-reasons")
    public ResponseEntity<?> getDiscountReasons() {
        return ResponseEntity.ok(settingService.getDiscountReasons());
    }

    @PutMapping("/discount-reasons")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setDiscountReasons(@RequestBody List<String> reasons) {
        settingService.setDiscountReasons(reasons);
        return ResponseEntity.ok(Map.of("message", "Discount reasons updated"));
    }

    // ── Payment methods ───────────────────────────────────────────────

    @GetMapping("/payment-methods")
    public ResponseEntity<?> getPaymentMethods() {
        return ResponseEntity.ok(settingService.getPaymentMethods());
    }

    @PutMapping("/payment-methods")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> setPaymentMethods(@RequestBody List<String> methods) {
        settingService.setPaymentMethods(methods);
        return ResponseEntity.ok(Map.of("message", "Payment methods updated"));
    }
}