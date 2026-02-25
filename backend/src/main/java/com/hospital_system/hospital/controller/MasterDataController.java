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
}