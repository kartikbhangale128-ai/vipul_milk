package com.vipulmilk.dto;

import com.vipulmilk.entity.MonthlyBill;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record MonthlyBillDto(
    Long id,
    Long customerId,
    String customerCode,
    String customerName,
    String customerPhone,
    Integer billingMonth,
    Integer billingYear,
    BigDecimal milkMorningLitres,
    BigDecimal milkEveningLitres,
    BigDecimal milkTotalLitres,
    BigDecimal morningTotal,
    BigDecimal eveningTotal,
    BigDecimal milkTotalAmount,
    BigDecimal productTotal,
    BigDecimal grandTotal,
    MonthlyBill.BillStatus billStatus,
    String pdfPath,
    OffsetDateTime generatedAt,
    OffsetDateTime finalizedAt
) {}

