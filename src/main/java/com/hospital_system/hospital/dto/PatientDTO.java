package com.hospital_system.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PatientDTO {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Phone is required")
    private String phone;

    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Gender is required")
    private String gender;

    @NotBlank(message = "Date of birth is required")
    @Pattern(regexp = "^\\d{4}-\\d{2}-\\d{2}$", message = "DOB must be in yyyy-MM-dd format")
    private String dob;

    public PatientDTO() {}

    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getGender() { return gender; }
    public String getDob() { return dob; }

    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setGender(String gender) { this.gender = gender; }
    public void setDob(String dob) { this.dob = dob; }
}
