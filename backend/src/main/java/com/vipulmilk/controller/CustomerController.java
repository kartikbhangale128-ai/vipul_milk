package com.vipulmilk.controller;

import com.vipulmilk.dto.CustomerDto;
import com.vipulmilk.dto.CustomerRequest;
import com.vipulmilk.dto.MilkEntryDto;
import com.vipulmilk.dto.ProductEntryDto;
import com.vipulmilk.entity.MonthlyBill;
import com.vipulmilk.repository.MonthlyBillRepository;
import com.vipulmilk.service.CustomerService;
import com.vipulmilk.service.MilkEntryService;
import com.vipulmilk.service.ProductEntryService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerService customerService;
    private final MilkEntryService milkEntryService;
    private final ProductEntryService productEntryService;
    private final MonthlyBillRepository monthlyBillRepository;

    public CustomerController(CustomerService customerService,
                              MilkEntryService milkEntryService,
                              ProductEntryService productEntryService,
                              MonthlyBillRepository monthlyBillRepository) {
        this.customerService = customerService;
        this.milkEntryService = milkEntryService;
        this.productEntryService = productEntryService;
        this.monthlyBillRepository = monthlyBillRepository;
    }

    @GetMapping
    public ResponseEntity<Page<CustomerDto>> getCustomers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String shift,
            @RequestParam(required = false) Boolean activeOnly,
            @PageableDefault(size = 20, sort = "sortOrder", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(customerService.getCustomers(query, shift, activeOnly, pageable));
    }

    @GetMapping("/active-list")
    public ResponseEntity<List<CustomerDto>> getAllActiveCustomers() {
        return ResponseEntity.ok(customerService.getAllActiveCustomers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomerDto> getCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.getCustomerById(id));
    }

    @PostMapping
    public ResponseEntity<CustomerDto> createCustomer(@Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.createCustomer(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomerDto> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerRequest request) {
        return ResponseEntity.ok(customerService.updateCustomer(id, request));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<CustomerDto> deactivateCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.toggleCustomerStatus(id, false));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<CustomerDto> reactivateCustomer(@PathVariable Long id) {
        return ResponseEntity.ok(customerService.toggleCustomerStatus(id, true));
    }

    @PutMapping("/reorder")
    public ResponseEntity<Void> reorderCustomers(@RequestBody List<Long> customerIds) {
        customerService.reorderCustomers(customerIds);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/milk-entries")
    public ResponseEntity<Page<MilkEntryDto>> getCustomerMilkEntries(
            @PathVariable Long id,
            @PageableDefault(size = 30) Pageable pageable) {
        return ResponseEntity.ok(milkEntryService.getCustomerMilkEntries(id, pageable));
    }

    @GetMapping("/{id}/product-entries")
    public ResponseEntity<Page<ProductEntryDto>> getCustomerProductEntries(
            @PathVariable Long id,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(productEntryService.getCustomerProductEntries(id, pageable));
    }

    @GetMapping("/{id}/bills")
    public ResponseEntity<Page<MonthlyBill>> getCustomerBills(
            @PathVariable Long id,
            @PageableDefault(size = 12) Pageable pageable) {
        return ResponseEntity.ok(monthlyBillRepository.findByCustomerIdOrderByBillingYearDescBillingMonthDesc(id, pageable));
    }
}

