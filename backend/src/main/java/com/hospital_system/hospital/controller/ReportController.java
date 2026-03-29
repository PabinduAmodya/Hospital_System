package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/overview")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'CASHIER')")
    public ResponseEntity<Map<String, Object>> getOverviewStats() {
        return ResponseEntity.ok(reportService.getOverviewStats());
    }

    @GetMapping("/revenue")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<List<Map<String, Object>>> getRevenueByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getRevenueByDateRange(startDate, endDate));
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ResponseEntity<Map<String, Object>> getAppointmentStats(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(reportService.getAppointmentStats(startDate, endDate));
    }

    @GetMapping("/doctors/performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getDoctorPerformance() {
        return ResponseEntity.ok(reportService.getDoctorPerformance());
    }

    @GetMapping("/revenue/monthly")
    @PreAuthorize("hasAnyRole('ADMIN', 'CASHIER')")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyRevenueTrend(
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getMonthlyRevenueTrend(months));
    }

    @GetMapping("/doctors/top")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTopDoctors(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(reportService.getTopDoctors(limit));
    }
}
