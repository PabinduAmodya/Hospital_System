package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "consultation_id")
    @JsonBackReference
    private Consultation consultation;

    @Column(nullable = false)
    private String drugName; // Brand name

    private String genericName; // Generic/scientific name

    private String dosage; // e.g., "500mg", "10ml"

    private String frequency; // e.g., "3 times daily", "Once daily", "Every 8 hours"

    private String duration; // e.g., "7 days", "14 days", "1 month"

    private String route; // ORAL, IV, IM, TOPICAL, INHALATION, SUBLINGUAL, RECTAL, OPHTHALMIC, OTIC, NASAL

    @Column(columnDefinition = "TEXT")
    private String instructions; // e.g., "Take after meals", "Apply to affected area"

    private boolean fromDatabase = false; // true if selected from OpenFDA

    private String fdaNdc; // FDA NDC code if from database

    private String dosageForm; // tablet, capsule, injection, syrup, cream, etc.

    private Integer quantity; // number of units to dispense

    private String manufacturer; // drug manufacturer

    // Default constructor
    public PrescriptionItem() {}

    // Constructor
    public PrescriptionItem(String drugName, String genericName, String dosage, String frequency, String duration, String route, String instructions) {
        this.drugName = drugName;
        this.genericName = genericName;
        this.dosage = dosage;
        this.frequency = frequency;
        this.duration = duration;
        this.route = route;
        this.instructions = instructions;
    }

    // ALL getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Consultation getConsultation() { return consultation; }
    public void setConsultation(Consultation consultation) { this.consultation = consultation; }

    public String getDrugName() { return drugName; }
    public void setDrugName(String drugName) { this.drugName = drugName; }

    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public boolean isFromDatabase() { return fromDatabase; }
    public void setFromDatabase(boolean fromDatabase) { this.fromDatabase = fromDatabase; }

    public String getFdaNdc() { return fdaNdc; }
    public void setFdaNdc(String fdaNdc) { this.fdaNdc = fdaNdc; }

    public String getDosageForm() { return dosageForm; }
    public void setDosageForm(String dosageForm) { this.dosageForm = dosageForm; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
}
