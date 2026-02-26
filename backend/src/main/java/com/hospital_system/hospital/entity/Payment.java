package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "bill_id")
    @JsonIgnoreProperties("items")
    private Bill bill;

    private BigDecimal amountPaid;

    private String paymentMethod; // CASH / CARD / ONLINE

    private LocalDateTime paidAt = LocalDateTime.now();

    public Payment() {}

    public Payment(Bill bill, BigDecimal amountPaid, String paymentMethod) {
        this.bill = bill;
        this.amountPaid = amountPaid;
        this.paymentMethod = paymentMethod;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public Bill getBill() { return bill; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public String getPaymentMethod() { return paymentMethod; }

    public void setId(Long id) { this.id = id; }
    public void setBill(Bill bill) { this.bill = bill; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}
