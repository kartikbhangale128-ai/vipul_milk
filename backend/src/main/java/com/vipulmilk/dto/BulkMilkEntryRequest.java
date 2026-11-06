package com.vipulmilk.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record BulkMilkEntryRequest(
    @NotEmpty(message = "Entry list cannot be empty")
    @Valid
    List<SingleMilkEntryItem> entries
) {}

