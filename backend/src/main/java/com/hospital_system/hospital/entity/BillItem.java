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

    private Integer quantity = 1;
    private BigDecimal unitPrice; // original unit price
    private BigDecimal discountAmount = BigDecimal.ZERO;
    private BigDecimal totalPrice; // (unitPrice * quantity) - discountAmount
    private String description; // optional notes for this line item

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
        this.unitPrice = price;
        this.totalPrice = price;
    }

    public BillItem(String itemName, String itemType, BigDecimal price, Bill bill,
                    Integer quantity, BigDecimal unitPrice, BigDecimal discountAmount, String description) {
        this.itemName = itemName;
        this.itemType = itemType;
        this.price = price;
        this.bill = bill;
        this.quantity = quantity != null ? quantity : 1;
        this.unitPrice = unitPrice != null ? unitPrice : price;
        this.discountAmount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        this.description = description;
        // Calculate totalPrice: (unitPrice * quantity) - discountAmount
        BigDecimal up = this.unitPrice != null ? this.unitPrice : BigDecimal.ZERO;
        this.totalPrice = up.multiply(BigDecimal.valueOf(this.quantity)).subtract(this.discountAmount);
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

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}