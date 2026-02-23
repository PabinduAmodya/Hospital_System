package com.hospital_system.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class DoctorDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Specialization is required")
    private String specialization;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @NotNull(message = "Channeling fee is required")
    @PositiveOrZero(message = "Channeling fee must be 0 or greater")
    private BigDecimal channeling_fee;

    public DoctorDTO() {}

    public DoctorDTO(String name, String specialization, String phone, String email, BigDecimal channeling_fee) {
        this.name = name;
        this.specialization = specialization;
        this.phone = phone;
        this.email = email;
        this.channeling_fee = channeling_fee;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public BigDecimal getChanneling_fee() { return channeling_fee; }
    public void setChanneling_fee(BigDecimal channeling_fee) { this.channeling_fee = channeling_fee; }
}
