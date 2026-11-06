package com.vipulmilk.dto;

public record AuthResponse(
    boolean authenticated,
    String username,
    String fullName,
    String message
) {}

