package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record MilkEntryDto(
    Long id,
    Long customerId,
    String customerCode,
    String customerName,
    LocalDate entryDate,
    BigDecimal morningLitres,
    BigDecimal eveningLitres,
    BigDecimal totalLitres,
    BigDecimal milkRate,
    BigDecimal morningAmount,
    BigDecimal eveningAmount,
    BigDecimal totalAmount,
    OffsetDateTime updatedAt
) {}

