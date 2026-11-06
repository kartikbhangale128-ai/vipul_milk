package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record ProductDto(
    Long id,
    String name,
    String unit,
    boolean active,
    BigDecimal currentPrice,
    LocalDate currentPriceEffectiveFrom,
    List<ProductPriceDto> priceHistory,
    OffsetDateTime createdAt
) {}

