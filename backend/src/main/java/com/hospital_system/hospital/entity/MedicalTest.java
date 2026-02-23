package com.hospital_system.hospital.entity;

import com.hospital_system.hospital.enums.TestType;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "medical_test")
public class MedicalTest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private TestType type;

    private BigDecimal price;

    private String description;

    private boolean active = true;

    // -------- Getters & Setters --------

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public TestType getType() {
        return type;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return active;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setType(TestType type) {
        this.type = type;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
