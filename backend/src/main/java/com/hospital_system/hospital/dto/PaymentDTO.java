package com.hospital_system.hospital.dto;

import java.math.BigDecimal;

public class PaymentDTO {
    private Long appointmentId;
    private BigDecimal amount;
    private String paymentMethod; // CASH, CARD, ONLINE
    private String transactionId;

    public PaymentDTO() {}

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
}