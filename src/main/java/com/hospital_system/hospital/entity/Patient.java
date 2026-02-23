package com.hospital_system.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "patients")
public class Patient {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String gender;
    private LocalDate dob;

    public Patient() {} // default constructor

    public Patient(String name, String phone, String email, String gender, LocalDate dob) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.gender = gender;
        this.dob = dob;
    }

    // Getters and setters for all fields
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public String getGender() { return gender; }
    public LocalDate getDob() { return dob; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setGender(String gender) { this.gender = gender; }
    public void setDob(LocalDate dob) { this.dob = dob; }
}
