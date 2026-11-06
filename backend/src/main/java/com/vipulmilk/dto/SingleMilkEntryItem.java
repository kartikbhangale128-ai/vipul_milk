package com.vipulmilk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record SingleMilkEntryItem(
    @NotNull(message = "Customer ID is required")
    Long customerId,

    @NotNull(message = "Date is required")
    LocalDate date,

    @DecimalMin(value = "0.00", message = "Morning litres cannot be negative")
    BigDecimal morningLitres,

    @DecimalMin(value = "0.00", message = "Evening litres cannot be negative")
    BigDecimal eveningLitres
) {}

