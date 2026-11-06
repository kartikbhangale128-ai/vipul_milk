package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BillCalculationResult(
    Long customerId,
    String customerCode,
    String customerName,
    String phone,
    String address,
    String deliveryPerson,
    int month,
    int year,
    BigDecimal morningLitres,
    BigDecimal eveningLitres,
    BigDecimal totalLitres,
    BigDecimal morningAmount,
    BigDecimal eveningAmount,
    BigDecimal milkTotalAmount,
    BigDecimal productTotalAmount,
    BigDecimal grandTotal,
    List<DailyMilkDetail> dailyMilkDetails,
    List<ProductPurchaseDetail> productDetails
) {
    public record DailyMilkDetail(
        LocalDate date,
        BigDecimal morningLitres,
        BigDecimal eveningLitres,
        BigDecimal rate,
        BigDecimal morningAmount,
        BigDecimal eveningAmount,
        BigDecimal totalAmount
    ) {}

    public record ProductPurchaseDetail(
        Long purchaseId,
        LocalDate date,
        String productName,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount
    ) {}
}

