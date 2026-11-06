package com.vipulmilk.controller;

import com.vipulmilk.dto.MilkRateDto;
import com.vipulmilk.dto.MilkRateRequest;
import com.vipulmilk.service.MilkRateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/milk-rates")
public class MilkRateController {

    private final MilkRateService milkRateService;

    public MilkRateController(MilkRateService milkRateService) {
        this.milkRateService = milkRateService;
    }

    @GetMapping
    public ResponseEntity<List<MilkRateDto>> getAllRates() {
        return ResponseEntity.ok(milkRateService.getAllRates());
    }

    @GetMapping("/current")
    public ResponseEntity<MilkRateDto> getCurrentRate() {
        return ResponseEntity.ok(milkRateService.getCurrentRate());
    }

    @PostMapping
    public ResponseEntity<MilkRateDto> addRate(@Valid @RequestBody MilkRateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(milkRateService.addRate(request));
    }
}

