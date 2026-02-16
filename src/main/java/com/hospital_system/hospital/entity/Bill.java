package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bills")
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private BigDecimal totalAmount = BigDecimal.ZERO;

    private boolean paid = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<BillItem> items;

    public Bill() {}

    public Bill(String patientName, Appointment appointment) {
        this.patientName = patientName;
        this.appointment = appointment;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public String getPatientName() { return patientName; }
    public Appointment getAppointment() { return appointment; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public boolean isPaid() { return paid; }
    public List<BillItem> getItems() { return items; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void setPaid(boolean paid) { this.paid = paid; }
    public void setItems(List<BillItem> items) { this.items = items; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}