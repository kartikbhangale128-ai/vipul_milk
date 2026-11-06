package com.vipulmilk.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "milk_entries", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"customer_id", "entry_date"})
})
public class MilkEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "morning_litres", nullable = false, precision = 10, scale = 3)
    private BigDecimal morningLitres = BigDecimal.ZERO;

    @Column(name = "evening_litres", nullable = false, precision = 10, scale = 3)
    private BigDecimal eveningLitres = BigDecimal.ZERO;

    @Column(name = "milk_rate", nullable = false, precision = 10, scale = 2)
    private BigDecimal milkRate;

    @Column(name = "morning_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal morningAmount = BigDecimal.ZERO;

    @Column(name = "evening_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal eveningAmount = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public MilkEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public LocalDate getEntryDate() { return entryDate; }
    public void setEntryDate(LocalDate entryDate) { this.entryDate = entryDate; }

    public BigDecimal getMorningLitres() { return morningLitres; }
    public void setMorningLitres(BigDecimal morningLitres) { this.morningLitres = morningLitres; }

    public BigDecimal getEveningLitres() { return eveningLitres; }
    public void setEveningLitres(BigDecimal eveningLitres) { this.eveningLitres = eveningLitres; }

    public BigDecimal getMilkRate() { return milkRate; }
    public void setMilkRate(BigDecimal milkRate) { this.milkRate = milkRate; }

    public BigDecimal getMorningAmount() { return morningAmount; }
    public void setMorningAmount(BigDecimal morningAmount) { this.morningAmount = morningAmount; }

    public BigDecimal getEveningAmount() { return eveningAmount; }
    public void setEveningAmount(BigDecimal eveningAmount) { this.eveningAmount = eveningAmount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

