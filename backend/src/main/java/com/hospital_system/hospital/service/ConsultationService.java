package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.*;
import com.hospital_system.hospital.enums.AppointmentStatus;
import com.hospital_system.hospital.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConsultationService {

    @Autowired
    private ConsultationRepository consultationRepository;

    @Autowired
    private PrescriptionItemRepository prescriptionItemRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private MedicalTestRepository medicalTestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GroqService groqService;

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

    private String generateConsultationNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        String prefix = "CON-" + year + "-";
        List<String> latest = consultationRepository.findLatestConsultationNumberByPrefix(prefix,
                PageRequest.of(0, 1));
        int nextNum = 1;
        if (!latest.isEmpty()) {
            String lastNum = latest.get(0).substring(prefix.length());
            nextNum = Integer.parseInt(lastNum) + 1;
        }
        return prefix + String.format("%05d", nextNum);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Start Consultation (from appointment)
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation startConsultation(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        // Validate appointment status
        if (appointment.getStatus() == AppointmentStatus.CANCELLED
                || appointment.getStatus() == AppointmentStatus.RESCHEDULED) {
            throw new RuntimeException("Cannot start consultation for a "
                    + appointment.getStatus() + " appointment");
        }

        // Check no existing consultation for this appointment
        List<Consultation> existing = consultationRepository.findByAppointmentId(appointmentId);
        if (!existing.isEmpty()) {
            throw new RuntimeException("A consultation already exists for appointment ID: " + appointmentId);
        }

        // Create consultation
        Consultation consultation = new Consultation();
        consultation.setAppointment(appointment);
        consultation.setPatient(appointment.getPatient());
        consultation.setDoctor(appointment.getSchedule().getDoctor());
        consultation.setStatus("IN_PROGRESS");
        consultation.setConsultationNumber(generateConsultationNumber());
        consultation.setConsultationDate(LocalDate.now());

        // Mark appointment as CONFIRMED if currently PENDING
        if (appointment.getStatus() == AppointmentStatus.PENDING) {
            appointment.setStatus(AppointmentStatus.CONFIRMED);
            appointmentRepository.save(appointment);
        }

        Consultation saved = consultationRepository.save(consultation);

        try {
            auditLogService.log("START_CONSULTATION", "Consultation", saved.getId(),
                    "Started consultation " + saved.getConsultationNumber()
                            + " for appointment #" + appointmentId);
        } catch (Exception ignored) {}

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Start Walk-in Consultation (no appointment)
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation startWalkInConsultation(Long patientId, Long doctorId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));

        Consultation consultation = new Consultation();
        consultation.setPatient(patient);
        consultation.setDoctor(doctor);
        consultation.setStatus("IN_PROGRESS");
        consultation.setConsultationNumber(generateConsultationNumber());
        consultation.setConsultationDate(LocalDate.now());

        Consultation saved = consultationRepository.save(consultation);

        try {
            auditLogService.log("START_WALK_IN_CONSULTATION", "Consultation", saved.getId(),
                    "Started walk-in consultation " + saved.getConsultationNumber()
                            + " for patient #" + patientId + " with doctor #" + doctorId);
        } catch (Exception ignored) {}

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Update Vitals
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateVitals(Long consultationId, Map<String, Object> vitals) {
        Consultation consultation = getById(consultationId);

        if (vitals.containsKey("bloodPressureSystolic") && vitals.get("bloodPressureSystolic") != null) {
            consultation.setBloodPressureSystolic(((Number) vitals.get("bloodPressureSystolic")).intValue());
        }
        if (vitals.containsKey("bloodPressureDiastolic") && vitals.get("bloodPressureDiastolic") != null) {
            consultation.setBloodPressureDiastolic(((Number) vitals.get("bloodPressureDiastolic")).intValue());
        }
        if (vitals.containsKey("temperature") && vitals.get("temperature") != null) {
            consultation.setTemperature(new BigDecimal(vitals.get("temperature").toString()));
        }
        if (vitals.containsKey("pulseRate") && vitals.get("pulseRate") != null) {
            consultation.setPulseRate(((Number) vitals.get("pulseRate")).intValue());
        }
        if (vitals.containsKey("spO2") && vitals.get("spO2") != null) {
            consultation.setSpO2(((Number) vitals.get("spO2")).intValue());
        }
        if (vitals.containsKey("weight") && vitals.get("weight") != null) {
            consultation.setWeight(new BigDecimal(vitals.get("weight").toString()));
        }
        if (vitals.containsKey("height") && vitals.get("height") != null) {
            consultation.setHeight(new BigDecimal(vitals.get("height").toString()));
        }
        if (vitals.containsKey("respiratoryRate") && vitals.get("respiratoryRate") != null) {
            consultation.setRespiratoryRate(((Number) vitals.get("respiratoryRate")).intValue());
        }

        // Auto-calculate BMI if weight and height are provided
        BigDecimal weight = consultation.getWeight();
        BigDecimal height = consultation.getHeight();
        if (weight != null && height != null && height.compareTo(BigDecimal.ZERO) > 0) {
            // BMI = weight(kg) / (height(cm)/100)^2
            BigDecimal heightInMeters = height.divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            BigDecimal bmi = weight.divide(heightInMeters.multiply(heightInMeters), 2, RoundingMode.HALF_UP);
            consultation.setBmi(bmi);
        }

        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Update Clinical Data
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateClinicalData(Long consultationId, Map<String, String> data) {
        Consultation consultation = getById(consultationId);

        if (data.containsKey("chiefComplaint")) {
            consultation.setChiefComplaint(data.get("chiefComplaint"));
        }
        if (data.containsKey("historyOfPresentIllness")) {
            consultation.setHistoryOfPresentIllness(data.get("historyOfPresentIllness"));
        }
        if (data.containsKey("pastMedicalHistory")) {
            consultation.setPastMedicalHistory(data.get("pastMedicalHistory"));
        }
        if (data.containsKey("allergies")) {
            consultation.setAllergies(data.get("allergies"));
        }
        if (data.containsKey("physicalExamination")) {
            consultation.setPhysicalExamination(data.get("physicalExamination"));
        }
        if (data.containsKey("diagnosis")) {
            consultation.setDiagnosis(data.get("diagnosis"));
        }

        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Prescription Items
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public PrescriptionItem addPrescriptionItem(Long consultationId, PrescriptionItem item) {
        Consultation consultation = getById(consultationId);
        item.setConsultation(consultation);
        return prescriptionItemRepository.save(item);
    }

    @Transactional
    public void removePrescriptionItem(Long consultationId, Long itemId) {
        PrescriptionItem item = prescriptionItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Prescription item not found with ID: " + itemId));

        if (item.getConsultation() == null || !item.getConsultation().getId().equals(consultationId)) {
            throw new RuntimeException("Prescription item does not belong to consultation #" + consultationId);
        }

        prescriptionItemRepository.delete(item);
    }

    @Transactional
    public PrescriptionItem updatePrescriptionItem(Long itemId, PrescriptionItem updated) {
        PrescriptionItem existing = prescriptionItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Prescription item not found with ID: " + itemId));

        if (updated.getDrugName() != null) existing.setDrugName(updated.getDrugName());
        if (updated.getGenericName() != null) existing.setGenericName(updated.getGenericName());
        if (updated.getDosage() != null) existing.setDosage(updated.getDosage());
        if (updated.getFrequency() != null) existing.setFrequency(updated.getFrequency());
        if (updated.getDuration() != null) existing.setDuration(updated.getDuration());
        if (updated.getRoute() != null) existing.setRoute(updated.getRoute());
        if (updated.getInstructions() != null) existing.setInstructions(updated.getInstructions());
        if (updated.getDosageForm() != null) existing.setDosageForm(updated.getDosageForm());
        if (updated.getQuantity() != null) existing.setQuantity(updated.getQuantity());
        if (updated.getManufacturer() != null) existing.setManufacturer(updated.getManufacturer());
        if (updated.getFdaNdc() != null) existing.setFdaNdc(updated.getFdaNdc());
        existing.setFromDatabase(updated.isFromDatabase());

        return prescriptionItemRepository.save(existing);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Lab Orders
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateLabOrders(Long consultationId, String testIds, String notes) {
        Consultation consultation = getById(consultationId);
        consultation.setLabOrderTestIds(testIds);
        consultation.setLabOrderNotes(notes);
        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Follow-up
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateFollowUp(Long consultationId, LocalDate followUpDate, String instructions) {
        Consultation consultation = getById(consultationId);
        consultation.setFollowUpDate(followUpDate);
        consultation.setSpecialInstructions(instructions);
        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Doctor Notes
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateNotes(Long consultationId, String notes) {
        Consultation consultation = getById(consultationId);
        consultation.setDoctorNotes(notes);
        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  AI Summary (manual update)
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation updateAiSummary(Long consultationId, String summary) {
        Consultation consultation = getById(consultationId);
        consultation.setAiSummary(summary);
        return consultationRepository.save(consultation);
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  AI Summary Generation
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public String generateAiSummary(Long consultationId) {
        Consultation consultation = getById(consultationId);
        Patient patient = consultation.getPatient();
        Doctor doctor = consultation.getDoctor();

        // Get prescription items
        List<PrescriptionItem> prescriptionItems = prescriptionItemRepository.findByConsultationId(consultationId);

        // Build medication list strings
        List<String> medications = prescriptionItems.stream()
                .map(item -> {
                    StringBuilder sb = new StringBuilder();
                    sb.append(item.getDrugName());
                    if (item.getGenericName() != null) sb.append(" (").append(item.getGenericName()).append(")");
                    if (item.getDosage() != null) sb.append(" - ").append(item.getDosage());
                    if (item.getFrequency() != null) sb.append(", ").append(item.getFrequency());
                    if (item.getDuration() != null) sb.append(" for ").append(item.getDuration());
                    if (item.getRoute() != null) sb.append(" [").append(item.getRoute()).append("]");
                    if (item.getInstructions() != null) sb.append(" | ").append(item.getInstructions());
                    return sb.toString();
                })
                .collect(Collectors.toList());

        // Get lab order test names from MedicalTestRepository
        List<String> labOrders = new ArrayList<>();
        if (consultation.getLabOrderTestIds() != null && !consultation.getLabOrderTestIds().isEmpty()) {
            String[] testIdStrings = consultation.getLabOrderTestIds().split(",");
            for (String testIdStr : testIdStrings) {
                try {
                    Long testId = Long.parseLong(testIdStr.trim());
                    medicalTestRepository.findById(testId)
                            .ifPresent(test -> labOrders.add(test.getName()));
                } catch (NumberFormatException ignored) {}
            }
        }

        // Call Groq service
        String summary = groqService.generateVisitSummary(
                patient.getName(),
                patient.getGender(),
                patient.getDob(),
                doctor.getName(),
                doctor.getSpecialization(),
                // Vitals
                consultation.getBloodPressureSystolic(),
                consultation.getBloodPressureDiastolic(),
                consultation.getTemperature(),
                consultation.getPulseRate(),
                consultation.getSpO2(),
                consultation.getWeight(),
                consultation.getHeight(),
                consultation.getBmi(),
                consultation.getRespiratoryRate(),
                // Clinical
                consultation.getChiefComplaint(),
                consultation.getHistoryOfPresentIllness(),
                consultation.getPastMedicalHistory(),
                consultation.getAllergies(),
                consultation.getPhysicalExamination(),
                consultation.getDiagnosis(),
                // Prescription
                medications,
                // Labs
                labOrders,
                // Follow-up
                consultation.getFollowUpDate(),
                consultation.getSpecialInstructions()
        );

        // Save the AI summary to consultation
        consultation.setAiSummary(summary);
        consultationRepository.save(consultation);

        return summary;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Complete Consultation
    // ────────────────────────────────────────────────────────────────────────────

    @Transactional
    public Consultation completeConsultation(Long consultationId) {
        Consultation consultation = getById(consultationId);
        consultation.setStatus("COMPLETED");
        consultation.setCompletedAt(LocalDateTime.now());

        // Mark linked appointment as COMPLETED if present
        if (consultation.getAppointment() != null) {
            Appointment appointment = consultation.getAppointment();
            appointment.setStatus(AppointmentStatus.COMPLETED);
            appointmentRepository.save(appointment);
        }

        Consultation saved = consultationRepository.save(consultation);

        try {
            auditLogService.log("COMPLETE_CONSULTATION", "Consultation", saved.getId(),
                    "Completed consultation " + saved.getConsultationNumber());
        } catch (Exception ignored) {}

        return saved;
    }

    // ────────────────────────────────────────────────────────────────────────────
    //  Query Methods
    // ────────────────────────────────────────────────────────────────────────────

    public Consultation getById(Long id) {
        return consultationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Consultation not found with ID: " + id));
    }

    public List<Consultation> getByDoctor(Long doctorId) {
        return consultationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
    }

    public List<Consultation> getByPatient(Long patientId) {
        return consultationRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    public List<Consultation> getTodayByDoctor(Long doctorId) {
        return consultationRepository.findTodayByDoctor(doctorId, LocalDate.now());
    }

    public List<Consultation> getByAppointment(Long appointmentId) {
        return consultationRepository.findByAppointmentId(appointmentId);
    }

    public List<Consultation> getRecentByDoctor(Long doctorId, int limit) {
        return consultationRepository.findRecentByDoctor(doctorId, PageRequest.of(0, limit));
    }

    public Map<String, Object> getDoctorStats(Long doctorId) {
        Map<String, Object> stats = new HashMap<>();

        // Total consultations
        List<Consultation> allConsultations = consultationRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
        stats.put("totalConsultations", (long) allConsultations.size());

        // Completed today
        LocalDate today = LocalDate.now();
        long completedToday = allConsultations.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus())
                        && today.equals(c.getConsultationDate()))
                .count();
        stats.put("completedToday", completedToday);

        // In progress
        long inProgress = allConsultations.stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus()))
                .count();
        stats.put("inProgress", inProgress);

        // Total distinct patients seen
        long totalPatientsSeen = allConsultations.stream()
                .map(c -> c.getPatient().getId())
                .distinct()
                .count();
        stats.put("totalPatientsSeen", totalPatientsSeen);

        return stats;
    }
}
