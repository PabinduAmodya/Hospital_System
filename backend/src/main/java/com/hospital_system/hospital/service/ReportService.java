package com.hospital_system.hospital.service;

import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * Returns a list of maps with {date, revenue} by summing paid bills grouped by date.
     */
    public List<Map<String, Object>> getRevenueByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        List<Object[]> results = billRepository.getRevenueByDateRange(startDateTime, endDateTime);

        List<Map<String, Object>> revenueData = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", row[0]);
            entry.put("revenue", row[1]);
            revenueData.add(entry);
        }
        return revenueData;
    }

    /**
     * Returns map with counts by status (PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED).
     */
    public Map<String, Object> getAppointmentStats(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> stats = new LinkedHashMap<>();

        AppointmentStatus[] statuses = {
                AppointmentStatus.PENDING,
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELLED,
                AppointmentStatus.RESCHEDULED
        };

        long total = 0;
        for (AppointmentStatus status : statuses) {
            long count = appointmentRepository.countByDateRangeAndStatus(startDate, endDate, status);
            stats.put(status.name(), count);
            total += count;
        }
        stats.put("total", total);

        return stats;
    }

    /**
     * Returns list of maps with doctor performance data.
     */
    public List<Map<String, Object>> getDoctorPerformance() {
        List<Object[]> appointmentStats = appointmentRepository.getDoctorAppointmentStats();
        List<Object[]> revenueStats = billRepository.getRevenueByDoctor();

        // Build a map of doctorId -> revenue
        Map<Long, BigDecimal> revenueMap = new HashMap<>();
        for (Object[] row : revenueStats) {
            Long doctorId = (Long) row[0];
            BigDecimal revenue = (BigDecimal) row[1];
            revenueMap.put(doctorId, revenue);
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : appointmentStats) {
            Map<String, Object> entry = new LinkedHashMap<>();
            Long doctorId = (Long) row[0];
            entry.put("doctorId", doctorId);
            entry.put("doctorName", row[1]);
            entry.put("specialization", row[2]);
            entry.put("totalAppointments", row[3]);
            entry.put("completedAppointments", row[4]);
            entry.put("cancelledAppointments", row[5]);
            entry.put("revenue", revenueMap.getOrDefault(doctorId, BigDecimal.ZERO));
            result.add(entry);
        }

        return result;
    }

    /**
     * Returns overview stats: totalPatients, totalDoctors, todayAppointments, totalRevenue,
     * pendingBills, todayRevenue, weeklyAppointments, monthlyRevenue.
     */
    public Map<String, Object> getOverviewStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalPatients", patientRepository.count());
        stats.put("totalDoctors", doctorRepository.count());
        stats.put("todayAppointments", appointmentRepository.countToday());
        stats.put("totalRevenue", billRepository.sumRevenue());
        stats.put("pendingBills", billRepository.countPending());

        // Today's revenue
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        stats.put("todayRevenue", billRepository.sumRevenueSince(todayStart));

        // Weekly appointments (current week: Monday to Sunday)
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);
        LocalDate weekEnd = weekStart.plusDays(6);
        stats.put("weeklyAppointments", appointmentRepository.countByDateBetween(weekStart, weekEnd));

        // Monthly revenue (from start of current month)
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        stats.put("monthlyRevenue", billRepository.sumRevenueSince(monthStart));

        return stats;
    }

    /**
     * Returns list of maps with {month, year, revenue} for past N months.
     */
    public List<Map<String, Object>> getMonthlyRevenueTrend(int months) {
        LocalDateTime since = LocalDate.now().minusMonths(months).withDayOfMonth(1).atStartOfDay();
        List<Object[]> results = billRepository.getMonthlyRevenue(since);

        List<Map<String, Object>> trend = new ArrayList<>();
        for (Object[] row : results) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month", row[0]);
            entry.put("year", row[1]);
            entry.put("revenue", row[2]);
            trend.add(entry);
        }
        return trend;
    }

    /**
     * Returns top N doctors by appointment count.
     */
    public List<Map<String, Object>> getTopDoctors(int limit) {
        List<Object[]> results = appointmentRepository.findTopDoctorsByAppointmentCount();

        return results.stream()
                .limit(limit)
                .map(row -> {
                    Map<String, Object> entry = new LinkedHashMap<>();
                    entry.put("doctorId", row[0]);
                    entry.put("doctorName", row[1]);
                    entry.put("specialization", row[2]);
                    entry.put("totalAppointments", row[3]);
                    return entry;
                })
                .collect(Collectors.toList());
    }
}
