package com.vipulmilk.dto;

import java.time.OffsetDateTime;

public record CustomerDto(
    Long id,
    String customerCode,
    String name,
    String phone,
    String address,
    String deliveryPerson,
    Integer sortOrder,
    java.math.BigDecimal defaultMorningLitres,
    java.math.BigDecimal defaultEveningLitres,
    boolean active,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
