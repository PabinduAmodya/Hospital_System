package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.repository.*;
import com.hospital_system.hospital.service.AppointmentService;
import com.hospital_system.hospital.service.SystemSettingService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patient-portal")
@CrossOrigin(origins = "*")
public class PatientPortalController {

    @Autowired private UserRepository userRepository;
    @Autowired private PatientRepository patientRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private BillRepository billRepository;
    @Autowired private ConsultationRepository consultationRepository;
    @Autowired private DoctorRepository doctorRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private AppointmentService appointmentService;
    @Autowired private SystemSettingService settingService;
    @Autowired private PasswordEncoder passwordEncoder;

    // Helper to get current patient
    private Patient getCurrentPatient() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getPatient() == null) throw new RuntimeException("No patient profile linked");
        return user.getPatient();
    }

    // ── Auth ──

    // Patient self-registration
    @PostMapping("/register")
    public ResponseEntity<?> registerPatient(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String phone = body.get("phone");
            String email = body.get("email");
            String gender = body.get("gender");
            String dob = body.get("dob"); // yyyy-MM-dd
            String password = body.get("password");
            String username = body.get("username"); // could be phone or email

            if (name == null || phone == null || password == null || username == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Name, phone, username and password are required"));
            }

            // Check username uniqueness
            if (userRepository.existsByUsername(username)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
            }

            // Create Patient record
            Patient patient = new Patient();
            patient.setName(name);
            patient.setPhone(phone);
            patient.setEmail(email);
            patient.setGender(gender);
            if (dob != null && !dob.isEmpty()) {
                patient.setDob(LocalDate.parse(dob));
            }
            patient = patientRepository.save(patient);

            // Create User with PATIENT role
            User user = new User();
            user.setName(name);
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(Role.PATIENT);
            user.setEnabled(true);
            user.setEmail(email);
            user.setPatient(patient);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Registration successful. You can now login.", "patientId", patient.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Profile ──

    @GetMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getProfile() {
        try {
            Patient patient = getCurrentPatient();
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        try {
            Patient patient = getCurrentPatient();
            if (body.containsKey("name")) patient.setName(body.get("name"));
            if (body.containsKey("phone")) patient.setPhone(body.get("phone"));
            if (body.containsKey("email")) patient.setEmail(body.get("email"));
            if (body.containsKey("gender")) patient.setGender(body.get("gender"));
            if (body.containsKey("dob") && body.get("dob") != null) {
                patient.setDob(LocalDate.parse(body.get("dob")));
            }
            patientRepository.save(patient);
            return ResponseEntity.ok(patient);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Doctors (public-ish, but authenticated) ──

    @GetMapping("/doctors")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getDoctors() {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/doctors/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getDoctorDetail(@PathVariable Long id) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
            return ResponseEntity.ok(doctor);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get available slots for a doctor on a specific date
    @GetMapping("/doctors/{doctorId}/slots")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getAvailableSlots(@PathVariable Long doctorId,
                                                @RequestParam String date) {
        try {
            LocalDate appointmentDate = LocalDate.parse(date);
            String dayName = appointmentDate.getDayOfWeek().name();

            // Get doctor's schedules for that day
            List<Schedule> schedules = scheduleRepository.findByDoctorId(doctorId);
            List<Schedule> daySchedules = schedules.stream()
                .filter(s -> s.getDay().equalsIgnoreCase(dayName))
                .collect(Collectors.toList());

            if (daySchedules.isEmpty()) {
                return ResponseEntity.ok(Map.of("available", false, "message", "Doctor not available on this day", "slots", List.of()));
            }

            // Count booked appointments
            List<Appointment> booked = appointmentRepository.findBookedSlotsByDoctorAndDate(doctorId, appointmentDate);
            int bookedCount = booked.size();
            int maxSlots = 20; // max per day

            List<Map<String, Object>> slots = new ArrayList<>();
            for (Schedule s : daySchedules) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("scheduleId", s.getId());
                slot.put("startTime", s.getStartTime());
                slot.put("endTime", s.getEndTime());
                slot.put("bookedCount", bookedCount);
                slot.put("maxSlots", maxSlots);
                slot.put("availableSlots", Math.max(0, maxSlots - bookedCount));
                slots.add(slot);
            }

            return ResponseEntity.ok(Map.of(
                "available", bookedCount < maxSlots,
                "date", date,
                "day", dayName,
                "slots", slots,
                "hospitalCharge", settingService.getHospitalCharge()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Appointments ──

    @PostMapping("/appointments/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookAppointment(@RequestBody Map<String, Object> body) {
        try {
            Patient patient = getCurrentPatient();
            Long scheduleId = ((Number) body.get("scheduleId")).longValue();
            String dateStr = (String) body.get("date");
            String notes = (String) body.get("notes");

            LocalDate date = LocalDate.parse(dateStr);
            Appointment appt = appointmentService.bookAppointment(patient.getId(), scheduleId, date);
            if (notes != null && !notes.isEmpty()) {
                appt.setNotes(notes);
                appointmentRepository.save(appt);
            }
            return ResponseEntity.ok(appt);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyAppointments() {
        try {
            Patient patient = getCurrentPatient();
            List<Appointment> appointments = appointmentRepository.findByPatientId(patient.getId());
            // Sort by date descending
            appointments.sort((a, b) -> {
                if (a.getAppointmentDate() == null) return 1;
                if (b.getAppointmentDate() == null) return -1;
                return b.getAppointmentDate().compareTo(a.getAppointmentDate());
            });
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/appointments/upcoming")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getUpcomingAppointments() {
        try {
            Patient patient = getCurrentPatient();
            List<Appointment> all = appointmentRepository.findByPatientId(patient.getId());
            LocalDate today = LocalDate.now();
            List<Appointment> upcoming = all.stream()
                .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(today))
                .filter(a -> !"CANCELLED".equals(a.getStatus().name()) && !"RESCHEDULED".equals(a.getStatus().name()))
                .sorted((a, b) -> a.getAppointmentDate().compareTo(b.getAppointmentDate()))
                .collect(Collectors.toList());
            return ResponseEntity.ok(upcoming);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/appointments/{id}/cancel")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Patient patient = getCurrentPatient();
            Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
            // Security: ensure this appointment belongs to this patient
            if (!appt.getPatient().getId().equals(patient.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not your appointment"));
            }
            String reason = body.getOrDefault("reason", "Cancelled by patient");
            appointmentService.cancelAppointment(id, reason, false);
            return ResponseEntity.ok(Map.of("message", "Appointment cancelled"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Bills ──

    @GetMapping("/bills")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyBills() {
        try {
            Patient patient = getCurrentPatient();
            List<Bill> bills = billRepository.findByPatientId(patient.getId());
            bills.sort((a, b) -> {
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
            return ResponseEntity.ok(bills);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/bills/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getBillDetail(@PathVariable Long id) {
        try {
            Patient patient = getCurrentPatient();
            Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bill not found"));
            if (!patient.getId().equals(bill.getPatientId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not your bill"));
            }
            return ResponseEntity.ok(bill);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Medical Records (Consultations) ──

    @GetMapping("/records")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyRecords() {
        try {
            Patient patient = getCurrentPatient();
            List<Consultation> consultations = consultationRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());
            return ResponseEntity.ok(consultations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/records/{id}")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getRecordDetail(@PathVariable Long id) {
        try {
            Patient patient = getCurrentPatient();
            Consultation c = consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Record not found"));
            if (!patient.getId().equals(c.getPatient().getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Not your record"));
            }
            return ResponseEntity.ok(c);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Dashboard Stats ──

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getDashboardStats() {
        try {
            Patient patient = getCurrentPatient();
            List<Appointment> allAppts = appointmentRepository.findByPatientId(patient.getId());
            List<Bill> allBills = billRepository.findByPatientId(patient.getId());
            List<Consultation> allConsultations = consultationRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId());

            LocalDate today = LocalDate.now();

            long upcomingCount = allAppts.stream()
                .filter(a -> a.getAppointmentDate() != null && !a.getAppointmentDate().isBefore(today))
                .filter(a -> !"CANCELLED".equals(a.getStatus().name()) && !"RESCHEDULED".equals(a.getStatus().name()))
                .count();

            long completedCount = allAppts.stream()
                .filter(a -> "COMPLETED".equals(a.getStatus().name()))
                .count();

            BigDecimal totalBilled = allBills.stream()
                .map(b -> b.getTotalAmount() != null ? b.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            long unpaidBills = allBills.stream()
                .filter(b -> !b.isPaid() && !b.isRefunded())
                .count();

            Map<String, Object> stats = new HashMap<>();
            stats.put("upcomingAppointments", upcomingCount);
            stats.put("completedVisits", completedCount);
            stats.put("totalAppointments", allAppts.size());
            stats.put("totalBilled", totalBilled);
            stats.put("unpaidBills", unpaidBills);
            stats.put("totalRecords", allConsultations.size());
            stats.put("patientName", patient.getName());
            stats.put("patientId", patient.getId());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Specializations (for filtering) ──

    @GetMapping("/specializations")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getSpecializations() {
        return ResponseEntity.ok(settingService.getSpecializations());
    }

    // ── Hospital Info ──

    @GetMapping("/hospital-info")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getHospitalInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("name", settingService.getHospitalName());
        info.put("address", settingService.getHospitalAddress());
        info.put("phone", settingService.getHospitalPhone());
        info.put("email", settingService.getHospitalEmail());
        return ResponseEntity.ok(info);
    }
}
