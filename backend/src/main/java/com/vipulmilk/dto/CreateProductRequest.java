package com.vipulmilk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateProductRequest(
    @NotBlank(message = "Product name is required")
    String name,

    @NotBlank(message = "Product unit is required (e.g. kg, litre, piece)")
    String unit,

    @NotNull(message = "Initial price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    BigDecimal initialPrice,

    @NotNull(message = "Effective date is required")
    LocalDate effectiveFrom
) {}

