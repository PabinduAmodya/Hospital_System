package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "consultations")
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String consultationNumber; // e.g., "CON-2026-00001"

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    @JsonIgnoreProperties({"rescheduledFrom", "rescheduledTo"})
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id", nullable = false)
    @JsonIgnoreProperties({"schedules"})
    private Doctor doctor;

    private LocalDate consultationDate;

    @Column(nullable = false)
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, CANCELLED

    // ── Vitals ──
    private Integer bloodPressureSystolic;
    private Integer bloodPressureDiastolic;
    private BigDecimal temperature; // in Celsius
    private Integer pulseRate; // bpm
    private Integer spO2; // percentage
    private BigDecimal weight; // kg
    private BigDecimal height; // cm
    private BigDecimal bmi; // auto-calculated
    private Integer respiratoryRate; // breaths per minute

    // ── Clinical ──
    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String historyOfPresentIllness;

    @Column(columnDefinition = "TEXT")
    private String pastMedicalHistory;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String physicalExamination;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    // ── Prescription ──
    @OneToMany(mappedBy = "consultation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<PrescriptionItem> prescriptionItems;

    // ── Lab Orders (store as comma-separated test IDs or JSON) ──
    @Column(columnDefinition = "TEXT")
    private String labOrderTestIds; // comma-separated test IDs

    @Column(columnDefinition = "TEXT")
    private String labOrderNotes;

    // ── Follow-up ──
    private LocalDate followUpDate;

    @Column(columnDefinition = "TEXT")
    private String specialInstructions;

    // ── AI Summary ──
    @Column(columnDefinition = "LONGTEXT")
    private String aiSummary;

    // ── Doctor Notes ──
    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    // ── Timestamps ──
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (consultationDate == null) consultationDate = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Default constructor
    public Consultation() {}

    // Generate ALL getters and setters for every field
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConsultationNumber() { return consultationNumber; }
    public void setConsultationNumber(String consultationNumber) { this.consultationNumber = consultationNumber; }

    public Appointment getAppointment() { return appointment; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public LocalDate getConsultationDate() { return consultationDate; }
    public void setConsultationDate(LocalDate consultationDate) { this.consultationDate = consultationDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getBloodPressureSystolic() { return bloodPressureSystolic; }
    public void setBloodPressureSystolic(Integer bloodPressureSystolic) { this.bloodPressureSystolic = bloodPressureSystolic; }

    public Integer getBloodPressureDiastolic() { return bloodPressureDiastolic; }
    public void setBloodPressureDiastolic(Integer bloodPressureDiastolic) { this.bloodPressureDiastolic = bloodPressureDiastolic; }

    public BigDecimal getTemperature() { return temperature; }
    public void setTemperature(BigDecimal temperature) { this.temperature = temperature; }

    public Integer getPulseRate() { return pulseRate; }
    public void setPulseRate(Integer pulseRate) { this.pulseRate = pulseRate; }

    public Integer getSpO2() { return spO2; }
    public void setSpO2(Integer spO2) { this.spO2 = spO2; }

    public BigDecimal getWeight() { return weight; }
    public void setWeight(BigDecimal weight) { this.weight = weight; }

    public BigDecimal getHeight() { return height; }
    public void setHeight(BigDecimal height) { this.height = height; }

    public BigDecimal getBmi() { return bmi; }
    public void setBmi(BigDecimal bmi) { this.bmi = bmi; }

    public Integer getRespiratoryRate() { return respiratoryRate; }
    public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getHistoryOfPresentIllness() { return historyOfPresentIllness; }
    public void setHistoryOfPresentIllness(String historyOfPresentIllness) { this.historyOfPresentIllness = historyOfPresentIllness; }

    public String getPastMedicalHistory() { return pastMedicalHistory; }
    public void setPastMedicalHistory(String pastMedicalHistory) { this.pastMedicalHistory = pastMedicalHistory; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getPhysicalExamination() { return physicalExamination; }
    public void setPhysicalExamination(String physicalExamination) { this.physicalExamination = physicalExamination; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public List<PrescriptionItem> getPrescriptionItems() { return prescriptionItems; }
    public void setPrescriptionItems(List<PrescriptionItem> prescriptionItems) { this.prescriptionItems = prescriptionItems; }

    public String getLabOrderTestIds() { return labOrderTestIds; }
    public void setLabOrderTestIds(String labOrderTestIds) { this.labOrderTestIds = labOrderTestIds; }

    public String getLabOrderNotes() { return labOrderNotes; }
    public void setLabOrderNotes(String labOrderNotes) { this.labOrderNotes = labOrderNotes; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public String getDoctorNotes() { return doctorNotes; }
    public void setDoctorNotes(String doctorNotes) { this.doctorNotes = doctorNotes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
