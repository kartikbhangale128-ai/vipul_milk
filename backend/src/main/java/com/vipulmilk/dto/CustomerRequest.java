package com.vipulmilk.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerRequest(
    @NotBlank(message = "Customer name is required")
    @Size(min = 2, max = 150, message = "Name must be between 2 and 150 characters")
    String name,

    String phone,
    String address,
    String deliveryPerson,
    java.math.BigDecimal defaultMorningLitres,
    java.math.BigDecimal defaultEveningLitres
) {
    public CustomerRequest(String name, String phone, String address) {
        this(name, phone, address, null, null, null);
    }
}
