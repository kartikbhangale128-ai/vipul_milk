package com.vipulmilk.controller;

import com.vipulmilk.dto.ProductEntryDto;
import com.vipulmilk.dto.ProductEntryRequest;
import com.vipulmilk.service.ProductEntryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/product-entries")
public class ProductEntryController {

    private final ProductEntryService productEntryService;

    public ProductEntryController(ProductEntryService productEntryService) {
        this.productEntryService = productEntryService;
    }

    @GetMapping
    public ResponseEntity<Page<ProductEntryDto>> searchEntries(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "purchaseDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(productEntryService.searchEntries(customerId, productId, startDate, endDate, pageable));
    }

    @PostMapping
    public ResponseEntity<ProductEntryDto> createEntry(@Valid @RequestBody ProductEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productEntryService.createEntry(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductEntryDto> updateEntry(
            @PathVariable Long id,
            @Valid @RequestBody ProductEntryRequest request) {
        return ResponseEntity.ok(productEntryService.updateEntry(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEntry(@PathVariable Long id) {
        productEntryService.deleteEntry(id);
        return ResponseEntity.ok(Map.of("message", "Product purchase deleted successfully"));
    }
}

