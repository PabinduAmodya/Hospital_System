package com.hospital_system.hospital.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "bill_items")
public class BillItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemName;
    private String itemType;
    private BigDecimal price;

    @ManyToOne
    @JoinColumn(name = "bill_id")
    @JsonBackReference
    private Bill bill;

    public BillItem() {}

    public BillItem(String itemName, String itemType, BigDecimal price, Bill bill) {
        this.itemName = itemName;
        this.itemType = itemType;
        this.price = price;
        this.bill = bill;
    }

    // Getters & Setters
    public Long getId() { return id; }
    public String getItemName() { return itemName; }
    public String getItemType() { return itemType; }
    public BigDecimal getPrice() { return price; }
    public Bill getBill() { return bill; }

    public void setId(Long id) { this.id = id; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public void setItemType(String itemType) { this.itemType = itemType; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public void setBill(Bill bill) { this.bill = bill; }
}