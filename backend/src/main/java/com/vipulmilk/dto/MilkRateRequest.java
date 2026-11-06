package com.vipulmilk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record MilkRateRequest(
    @NotNull(message = "Rate per litre is required")
    @DecimalMin(value = "0.01", message = "Rate per litre must be greater than 0")
    BigDecimal ratePerLitre,

    @NotNull(message = "Effective date is required")
    LocalDate effectiveFrom,

    String note
) {}

