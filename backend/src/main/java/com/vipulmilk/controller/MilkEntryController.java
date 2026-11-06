package com.vipulmilk.controller;

import com.vipulmilk.dto.BulkMilkEntryRequest;
import com.vipulmilk.dto.MilkEntryDto;
import com.vipulmilk.service.MilkEntryService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/milk-entries")
public class MilkEntryController {

    private final MilkEntryService milkEntryService;

    public MilkEntryController(MilkEntryService milkEntryService) {
        this.milkEntryService = milkEntryService;
    }

    @GetMapping("/grid")
    public ResponseEntity<List<MilkEntryDto>> getEntriesForGrid(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<Long> customerIds) {
        return ResponseEntity.ok(milkEntryService.getEntriesForGrid(startDate, endDate, customerIds));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<MilkEntryDto>> bulkSaveEntries(@Valid @RequestBody BulkMilkEntryRequest request) {
        return ResponseEntity.ok(milkEntryService.bulkSaveEntries(request));
    }
}

