package com.vipulmilk.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public record ProductEntryRequest(
    @NotNull(message = "Customer ID is required")
    Long customerId,

    @NotNull(message = "Product ID is required")
    Long productId,

    @NotNull(message = "Purchase date is required")
    LocalDate purchaseDate,

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than zero")
    BigDecimal quantity,

    String notes
) {}

