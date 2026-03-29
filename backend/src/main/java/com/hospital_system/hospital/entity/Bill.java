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
    private Long patientId;          // set for both appointment bills and standalone test bills
    private String billType = "APPOINTMENT"; // APPOINTMENT | TEST_ONLY

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private BigDecimal totalAmount = BigDecimal.ZERO;

    private boolean paid = false;

    // Added: when and how the bill was paid
    private LocalDateTime paidAt;
    private String paymentMethod;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Refund tracking
    private boolean refunded = false;
    private BigDecimal refundAmount;
    private String refundReason;
    private String refundMethod;
    private LocalDateTime refundedAt;

    // ── Real-world billing fields ──

    // Auto-generated bill number (e.g., "BILL-2026-00001")
    @Column(unique = true)
    private String billNumber;

    // Discount
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private String discountReason; // e.g., "Senior Citizen", "Staff", "Insurance", "Custom"
    private BigDecimal discountPercentage; // null if flat amount discount

    // Tax
    private BigDecimal taxPercentage = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;

    // Subtotal (before discount and tax)
    private BigDecimal subTotal = BigDecimal.ZERO;

    // Net amount after discount, before tax (subTotal - discountAmount)
    private BigDecimal netAmount = BigDecimal.ZERO;

    // Partial payment tracking
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal dueAmount = BigDecimal.ZERO;
    private String paymentStatus = "UNPAID"; // UNPAID, PARTIAL, PAID, REFUNDED

    // Notes
    @Column(columnDefinition = "TEXT")
    private String notes;

    // Who created/processed this bill
    private String createdBy;
    private String paidBy; // cashier who processed payment

    // Insurance
    private String insuranceProvider;
    private String insurancePolicyNumber;
    private BigDecimal insuranceCoverage = BigDecimal.ZERO;

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
    public LocalDateTime getPaidAt() { return paidAt; }
    public String getPaymentMethod() { return paymentMethod; }

    public void setId(Long id) { this.id = id; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public void setPaid(boolean paid) { this.paid = paid; }
    public void setItems(List<BillItem> items) { this.items = items; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
    public Long getPatientId() { return patientId; }
    public String getBillType() { return billType; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }
    public void setBillType(String billType) { this.billType = billType; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public boolean isRefunded() { return refunded; }
    public void setRefunded(boolean refunded) { this.refunded = refunded; }
    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }
    public String getRefundMethod() { return refundMethod; }
    public void setRefundMethod(String refundMethod) { this.refundMethod = refundMethod; }
    public LocalDateTime getRefundedAt() { return refundedAt; }
    public void setRefundedAt(LocalDateTime refundedAt) { this.refundedAt = refundedAt; }

    // ── Getters & Setters for real-world billing fields ──

    public String getBillNumber() { return billNumber; }
    public void setBillNumber(String billNumber) { this.billNumber = billNumber; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getDiscountReason() { return discountReason; }
    public void setDiscountReason(String discountReason) { this.discountReason = discountReason; }

    public BigDecimal getDiscountPercentage() { return discountPercentage; }
    public void setDiscountPercentage(BigDecimal discountPercentage) { this.discountPercentage = discountPercentage; }

    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getSubTotal() { return subTotal; }
    public void setSubTotal(BigDecimal subTotal) { this.subTotal = subTotal; }

    public BigDecimal getNetAmount() { return netAmount; }
    public void setNetAmount(BigDecimal netAmount) { this.netAmount = netAmount; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }

    public BigDecimal getDueAmount() { return dueAmount; }
    public void setDueAmount(BigDecimal dueAmount) { this.dueAmount = dueAmount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getPaidBy() { return paidBy; }
    public void setPaidBy(String paidBy) { this.paidBy = paidBy; }

    public String getInsuranceProvider() { return insuranceProvider; }
    public void setInsuranceProvider(String insuranceProvider) { this.insuranceProvider = insuranceProvider; }

    public String getInsurancePolicyNumber() { return insurancePolicyNumber; }
    public void setInsurancePolicyNumber(String insurancePolicyNumber) { this.insurancePolicyNumber = insurancePolicyNumber; }

    public BigDecimal getInsuranceCoverage() { return insuranceCoverage; }
    public void setInsuranceCoverage(BigDecimal insuranceCoverage) { this.insuranceCoverage = insuranceCoverage; }
}