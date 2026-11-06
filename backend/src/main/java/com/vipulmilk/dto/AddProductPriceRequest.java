package com.vipulmilk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AddProductPriceRequest(
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal price,

    @NotNull(message = "Effective date is required")
    LocalDate effectiveFrom
) {}

