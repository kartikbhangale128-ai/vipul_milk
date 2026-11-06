package com.vipulmilk.controller;

import com.vipulmilk.dto.AddProductPriceRequest;
import com.vipulmilk.dto.CreateProductRequest;
import com.vipulmilk.dto.ProductDto;
import com.vipulmilk.dto.ProductPriceDto;
import com.vipulmilk.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> getAllProducts(
            @RequestParam(defaultValue = "false") boolean includeInactive) {
        return ResponseEntity.ok(productService.getAllProducts(includeInactive));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductDto> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> updateProduct(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String name = body.get("name");
        String unit = body.get("unit");
        return ResponseEntity.ok(productService.updateProduct(id, name, unit));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ProductDto> deactivateProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleProductStatus(id, false));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ProductDto> reactivateProduct(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleProductStatus(id, true));
    }

    @PostMapping("/{id}/prices")
    public ResponseEntity<ProductPriceDto> addPrice(
            @PathVariable Long id,
            @Valid @RequestBody AddProductPriceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.addProductPrice(id, request));
    }

    @GetMapping("/{id}/applicable-price")
    public ResponseEntity<Map<String, Object>> getApplicablePrice(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        BigDecimal price = productService.getApplicablePrice(id, date);
        return ResponseEntity.ok(Map.of(
                "productId", id,
                "date", date,
                "price", price
        ));
    }
}

