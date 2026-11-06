package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.util.List;

public record BillPreviewResponse(
    int month,
    int year,
    int totalBills,
    BigDecimal aggregateMilkLitres,
    BigDecimal aggregateMilkAmount,
    BigDecimal aggregateProductAmount,
    BigDecimal aggregateGrandTotal,
    List<BillCalculationResult> bills
) {}

