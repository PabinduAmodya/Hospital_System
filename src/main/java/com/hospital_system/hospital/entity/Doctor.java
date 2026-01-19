package com.hospital_system.hospital.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String specialization;
    private String phone;
    private String email;
    private String channelling_fee;

    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Schedule> schedules;

    public Doctor() {}

    public Doctor(String name, String specialization, String phone, String email,String channelling_fee) {
        this.name = name;
        this.specialization = specialization;
        this.phone = phone;
        this.email = email;
        this.channelling_fee=channelling_fee;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getChannelling_fee(){return  channelling_fee;}
    public void setChannelling_fee(String channelling_fee){this.channelling_fee=channelling_fee;}

    public List<Schedule> getSchedules() { return schedules; }
    public void setSchedules(List<Schedule> schedules) { this.schedules = schedules; }
}
