package com.hospital_system.hospital.dto;

public class MakePaymentDTO {
    private String paymentMethod;

    public MakePaymentDTO() {}

    public MakePaymentDTO(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }


    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}