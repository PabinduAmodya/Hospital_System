package com.hospital_system.hospital.dto;

public class DoctorDTO {

    private String name;
    private String specialization;
    private String phone;
    private String email;
    private String channeling_fee;

    public DoctorDTO() {}

    public DoctorDTO(String name, String specialization, String phone, String email,String channeling_fee) {
        this.name = name;
        this.specialization = specialization;
        this.phone = phone;
        this.email = email;
        this.channeling_fee=channeling_fee;
    }

    // Getters & Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getChanneling_fee() {
        return channeling_fee;
    }

    public void setChanneling_fee(String channeling_fee) {
        this.channeling_fee = channeling_fee;
    }
}
