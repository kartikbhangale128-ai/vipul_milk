package com.vipulmilk.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "monthly_bills", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"customer_id", "billing_month", "billing_year"})
})
public class MonthlyBill {

    public enum BillStatus {
        DRAFT,
        FINALIZED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "billing_month", nullable = false)
    private Integer billingMonth; // 1-12

    @Column(name = "billing_year", nullable = false)
    private Integer billingYear;

    @Column(name = "milk_morning_litres", nullable = false, precision = 10, scale = 3)
    private BigDecimal milkMorningLitres = BigDecimal.ZERO;

    @Column(name = "milk_evening_litres", nullable = false, precision = 10, scale = 3)
    private BigDecimal milkEveningLitres = BigDecimal.ZERO;

    @Column(name = "milk_total_litres", nullable = false, precision = 10, scale = 3)
    private BigDecimal milkTotalLitres = BigDecimal.ZERO;

    @Column(name = "morning_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal morningTotal = BigDecimal.ZERO;

    @Column(name = "evening_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal eveningTotal = BigDecimal.ZERO;

    @Column(name = "milk_total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal milkTotalAmount = BigDecimal.ZERO;

    @Column(name = "product_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal productTotal = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "bill_status", nullable = false, length = 20)
    private BillStatus billStatus = BillStatus.DRAFT;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "customer_snapshot", columnDefinition = "jsonb")
    private String customerSnapshot;

    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.JSON)
    @Column(name = "bill_snapshot", columnDefinition = "jsonb")
    private String billSnapshot;

    @Column(name = "pdf_path", length = 500)
    private String pdfPath;

    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt = OffsetDateTime.now();

    @Column(name = "finalized_at")
    private OffsetDateTime finalizedAt;

    public MonthlyBill() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Integer getBillingMonth() { return billingMonth; }
    public void setBillingMonth(Integer billingMonth) { this.billingMonth = billingMonth; }

    public Integer getBillingYear() { return billingYear; }
    public void setBillingYear(Integer billingYear) { this.billingYear = billingYear; }

    public BigDecimal getMilkMorningLitres() { return milkMorningLitres; }
    public void setMilkMorningLitres(BigDecimal milkMorningLitres) { this.milkMorningLitres = milkMorningLitres; }

    public BigDecimal getMilkEveningLitres() { return milkEveningLitres; }
    public void setMilkEveningLitres(BigDecimal milkEveningLitres) { this.milkEveningLitres = milkEveningLitres; }

    public BigDecimal getMilkTotalLitres() { return milkTotalLitres; }
    public void setMilkTotalLitres(BigDecimal milkTotalLitres) { this.milkTotalLitres = milkTotalLitres; }

    public BigDecimal getMorningTotal() { return morningTotal; }
    public void setMorningTotal(BigDecimal morningTotal) { this.morningTotal = morningTotal; }

    public BigDecimal getEveningTotal() { return eveningTotal; }
    public void setEveningTotal(BigDecimal eveningTotal) { this.eveningTotal = eveningTotal; }

    public BigDecimal getMilkTotalAmount() { return milkTotalAmount; }
    public void setMilkTotalAmount(BigDecimal milkTotalAmount) { this.milkTotalAmount = milkTotalAmount; }

    public BigDecimal getProductTotal() { return productTotal; }
    public void setProductTotal(BigDecimal productTotal) { this.productTotal = productTotal; }

    public BigDecimal getGrandTotal() { return grandTotal; }
    public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }

    public BillStatus getBillStatus() { return billStatus; }
    public void setBillStatus(BillStatus billStatus) { this.billStatus = billStatus; }

    public String getCustomerSnapshot() { return customerSnapshot; }
    public void setCustomerSnapshot(String customerSnapshot) { this.customerSnapshot = customerSnapshot; }

    public String getBillSnapshot() { return billSnapshot; }
    public void setBillSnapshot(String billSnapshot) { this.billSnapshot = billSnapshot; }

    public String getPdfPath() { return pdfPath; }
    public void setPdfPath(String pdfPath) { this.pdfPath = pdfPath; }

    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }

    public OffsetDateTime getFinalizedAt() { return finalizedAt; }
    public void setFinalizedAt(OffsetDateTime finalizedAt) { this.finalizedAt = finalizedAt; }
}

