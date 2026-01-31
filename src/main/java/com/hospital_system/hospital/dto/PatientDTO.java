package com.hospital_system.hospital.dto;

public class PatientDTO {
    private String name;
    private String phone;
    private String email;
    private String gender;
    private String dob;

    public PatientDTO() {} // default constructor needed

    // Getters
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getGender() { return gender; }
    public String getDob() { return dob; }

    // Setters
    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setGender(String gender) { this.gender = gender; }
    public void setDob(String dob) { this.dob = dob; }
}

