package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ProductEntryDto(
    Long id,
    Long customerId,
    String customerCode,
    String customerName,
    Long productId,
    String productName,
    String unit,
    LocalDate purchaseDate,
    BigDecimal quantity,
    BigDecimal unitPrice,
    BigDecimal totalAmount,
    String notes,
    OffsetDateTime updatedAt
) {}

