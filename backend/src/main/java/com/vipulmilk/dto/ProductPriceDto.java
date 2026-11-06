package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ProductPriceDto(
    Long id,
    Long productId,
    String productName,
    BigDecimal price,
    LocalDate effectiveFrom,
    OffsetDateTime createdAt
) {}

