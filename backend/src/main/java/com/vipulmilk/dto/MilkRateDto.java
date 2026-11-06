package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record MilkRateDto(
    Long id,
    BigDecimal ratePerLitre,
    LocalDate effectiveFrom,
    String note,
    OffsetDateTime createdAt
) {}

