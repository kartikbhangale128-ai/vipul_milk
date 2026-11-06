package com.vipulmilk.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "milk_rates")
public class MilkRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rate_per_litre", nullable = false, precision = 10, scale = 2)
    private BigDecimal ratePerLitre;

    @Column(name = "effective_from", nullable = false, unique = true)
    private LocalDate effectiveFrom;

    @Column(length = 255)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public MilkRate() {}

    public MilkRate(BigDecimal ratePerLitre, LocalDate effectiveFrom, String note) {
        this.ratePerLitre = ratePerLitre;
        this.effectiveFrom = effectiveFrom;
        this.note = note;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getRatePerLitre() { return ratePerLitre; }
    public void setRatePerLitre(BigDecimal ratePerLitre) { this.ratePerLitre = ratePerLitre; }

    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}

