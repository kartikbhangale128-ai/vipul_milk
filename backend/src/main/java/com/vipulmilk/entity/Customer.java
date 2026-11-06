package com.vipulmilk.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "customers")
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_code", nullable = false, unique = true, length = 50)
    private String customerCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 30)
    private String phone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(name = "delivery_person", length = 50)
    private String deliveryPerson = "Ajay";

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "default_morning_litres")
    private java.math.BigDecimal defaultMorningLitres = java.math.BigDecimal.ZERO;

    @Column(name = "default_evening_litres")
    private java.math.BigDecimal defaultEveningLitres = java.math.BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public Customer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomerCode() { return customerCode; }
    public void setCustomerCode(String customerCode) { this.customerCode = customerCode; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getDeliveryPerson() { return deliveryPerson; }
    public void setDeliveryPerson(String deliveryPerson) { this.deliveryPerson = deliveryPerson; }

    public Integer getSortOrder() { return sortOrder != null ? sortOrder : 0; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public java.math.BigDecimal getDefaultMorningLitres() { return defaultMorningLitres != null ? defaultMorningLitres : java.math.BigDecimal.ZERO; }
    public void setDefaultMorningLitres(java.math.BigDecimal defaultMorningLitres) { this.defaultMorningLitres = defaultMorningLitres; }

    public java.math.BigDecimal getDefaultEveningLitres() { return defaultEveningLitres != null ? defaultEveningLitres : java.math.BigDecimal.ZERO; }
    public void setDefaultEveningLitres(java.math.BigDecimal defaultEveningLitres) { this.defaultEveningLitres = defaultEveningLitres; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

