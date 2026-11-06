package com.vipulmilk.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vipulmilk.dto.BillCalculationResult;
import com.vipulmilk.dto.BillPreviewResponse;
import com.vipulmilk.dto.MonthlyBillDto;
import com.vipulmilk.entity.*;
import com.vipulmilk.exception.BusinessRuleException;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.*;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final CustomerRepository customerRepository;
    private final MilkEntryRepository milkEntryRepository;
    private final ProductEntryRepository productEntryRepository;
    private final MonthlyBillRepository monthlyBillRepository;
    private final ObjectMapper objectMapper;

    public BillingService(CustomerRepository customerRepository,
                          MilkEntryRepository milkEntryRepository,
                          ProductEntryRepository productEntryRepository,
                          MonthlyBillRepository monthlyBillRepository,
                          ObjectMapper objectMapper) {
        this.customerRepository = customerRepository;
        this.milkEntryRepository = milkEntryRepository;
        this.productEntryRepository = productEntryRepository;
        this.monthlyBillRepository = monthlyBillRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Calculates bills preview for the given month and year.
     * Includes all customers who have activity in the month (active or deactivated) + active customers.
     */
    public BillPreviewResponse generatePreview(int month, int year) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // 1. Get all candidates: active customers or customers who have entries in this date range
        List<Customer> allCustomers = customerRepository.findAll();
        List<MilkEntry> allMilkEntries = milkEntryRepository.findEntriesInDateRange(startDate, endDate);
        List<ProductEntry> allProductEntries = productEntryRepository.findEntriesInDateRange(startDate, endDate);

        Map<Long, List<MilkEntry>> customerMilkMap = new HashMap<>();
        for (MilkEntry me : allMilkEntries) {
            customerMilkMap.computeIfAbsent(me.getCustomer().getId(), k -> new ArrayList<>()).add(me);
        }

        Map<Long, List<ProductEntry>> customerProductMap = new HashMap<>();
        for (ProductEntry pe : allProductEntries) {
            customerProductMap.computeIfAbsent(pe.getCustomer().getId(), k -> new ArrayList<>()).add(pe);
        }

        List<BillCalculationResult> results = new ArrayList<>();

        BigDecimal aggLitres = BigDecimal.ZERO;
        BigDecimal aggMilkAmount = BigDecimal.ZERO;
        BigDecimal aggProductAmount = BigDecimal.ZERO;
        BigDecimal aggGrandTotal = BigDecimal.ZERO;

        for (Customer c : allCustomers) {
            List<MilkEntry> milkEntries = customerMilkMap.getOrDefault(c.getId(), Collections.emptyList());
            List<ProductEntry> prodEntries = customerProductMap.getOrDefault(c.getId(), Collections.emptyList());

            // Skip customer if they have no entries and are inactive
            if (!c.isActive() && milkEntries.isEmpty() && prodEntries.isEmpty()) {
                continue;
            }

            // Also skip if no consumption at all
            if (milkEntries.isEmpty() && prodEntries.isEmpty()) {
                continue;
            }

            BillCalculationResult calc = calculateCustomerBill(c, month, year, milkEntries, prodEntries);
            results.add(calc);

            aggLitres = aggLitres.add(calc.totalLitres());
            aggMilkAmount = aggMilkAmount.add(calc.milkTotalAmount());
            aggProductAmount = aggProductAmount.add(calc.productTotalAmount());
            aggGrandTotal = aggGrandTotal.add(calc.grandTotal());
        }

        // Sort by customer name
        results.sort(Comparator.comparing(BillCalculationResult::customerName));

        return new BillPreviewResponse(
                month,
                year,
                results.size(),
                aggLitres,
                aggMilkAmount,
                aggProductAmount,
                aggGrandTotal,
                results
        );
    }

    public BillCalculationResult calculateSingleCustomerBill(Long customerId, int month, int year) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + customerId + " not found"));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<MilkEntry> milkEntries = milkEntryRepository.findByCustomerIdAndDateRange(customerId, startDate, endDate);
        List<ProductEntry> prodEntries = productEntryRepository.findByCustomerIdAndDateRange(customerId, startDate, endDate);

        return calculateCustomerBill(customer, month, year, milkEntries, prodEntries);
    }

    private BillCalculationResult calculateCustomerBill(Customer customer,
                                                        int month,
                                                        int year,
                                                        List<MilkEntry> milkEntries,
                                                        List<ProductEntry> productEntries) {
        BigDecimal mLitres = BigDecimal.ZERO;
        BigDecimal eLitres = BigDecimal.ZERO;
        BigDecimal mAmount = BigDecimal.ZERO;
        BigDecimal eAmount = BigDecimal.ZERO;

        List<BillCalculationResult.DailyMilkDetail> milkDetails = new ArrayList<>();

        for (MilkEntry me : milkEntries) {
            mLitres = mLitres.add(me.getMorningLitres());
            eLitres = eLitres.add(me.getEveningLitres());
            mAmount = mAmount.add(me.getMorningAmount());
            eAmount = eAmount.add(me.getEveningAmount());

            milkDetails.add(new BillCalculationResult.DailyMilkDetail(
                    me.getEntryDate(),
                    me.getMorningLitres(),
                    me.getEveningLitres(),
                    me.getMilkRate(),
                    me.getMorningAmount(),
                    me.getEveningAmount(),
                    me.getMorningAmount().add(me.getEveningAmount())
            ));
        }

        BigDecimal milkTotalLitres = mLitres.add(eLitres);
        BigDecimal milkTotalAmount = mAmount.add(eAmount);

        BigDecimal prodTotalAmount = BigDecimal.ZERO;
        List<BillCalculationResult.ProductPurchaseDetail> prodDetails = new ArrayList<>();

        for (ProductEntry pe : productEntries) {
            prodTotalAmount = prodTotalAmount.add(pe.getTotalAmount());
            prodDetails.add(new BillCalculationResult.ProductPurchaseDetail(
                    pe.getId(),
                    pe.getPurchaseDate(),
                    pe.getProduct().getName(),
                    pe.getProduct().getUnit(),
                    pe.getQuantity(),
                    pe.getUnitPrice(),
                    pe.getTotalAmount()
            ));
        }

        BigDecimal grandTotal = milkTotalAmount.add(prodTotalAmount);

        return new BillCalculationResult(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getName(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getDeliveryPerson(),
                month,
                year,
                mLitres,
                eLitres,
                milkTotalLitres,
                mAmount,
                eAmount,
                milkTotalAmount,
                prodTotalAmount,
                grandTotal,
                milkDetails,
                prodDetails
        );
    }

    /**
     * Finalizes all bills for month and year.
     * Once FINALIZED, bills cannot be recalculated or silently modified.
     */
    @Transactional
    public List<MonthlyBillDto> finalizeBills(int month, int year) {
        BillPreviewResponse preview = generatePreview(month, year);
        List<MonthlyBill> savedBills = new ArrayList<>();

        for (BillCalculationResult calc : preview.bills()) {
            Optional<MonthlyBill> existingOpt = monthlyBillRepository.findByCustomerIdAndBillingMonthAndBillingYear(
                    calc.customerId(), month, year);

            if (existingOpt.isPresent() && existingOpt.get().getBillStatus() == MonthlyBill.BillStatus.FINALIZED) {
                // Already finalized, skip to preserve exact historical snapshot
                savedBills.add(existingOpt.get());
                continue;
            }

            Customer customer = customerRepository.findById(calc.customerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer " + calc.customerId() + " not found"));

            MonthlyBill bill = existingOpt.orElseGet(MonthlyBill::new);
            bill.setCustomer(customer);
            bill.setBillingMonth(month);
            bill.setBillingYear(year);
            bill.setMilkMorningLitres(calc.morningLitres());
            bill.setMilkEveningLitres(calc.eveningLitres());
            bill.setMilkTotalLitres(calc.totalLitres());
            bill.setMorningTotal(calc.morningAmount());
            bill.setEveningTotal(calc.eveningAmount());
            bill.setMilkTotalAmount(calc.milkTotalAmount());
            bill.setProductTotal(calc.productTotalAmount());
            bill.setGrandTotal(calc.grandTotal());
            bill.setBillStatus(MonthlyBill.BillStatus.FINALIZED);
            bill.setFinalizedAt(OffsetDateTime.now());

            try {
                Map<String, Object> customerSnap = Map.of(
                        "id", customer.getId(),
                        "customerCode", customer.getCustomerCode(),
                        "name", customer.getName(),
                        "phone", customer.getPhone() != null ? customer.getPhone() : "",
                        "address", customer.getAddress() != null ? customer.getAddress() : ""
                );
                bill.setCustomerSnapshot(objectMapper.writeValueAsString(customerSnap));
                bill.setBillSnapshot(objectMapper.writeValueAsString(calc));
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize bill snapshot for customer {}", customer.getId(), e);
            }

            savedBills.add(monthlyBillRepository.save(bill));
        }

        return savedBills.stream().map(this::toDto).toList();
    }

    public Page<MonthlyBillDto> searchBills(Integer month, Integer year, Long customerId, MonthlyBill.BillStatus status, Pageable pageable) {
        return monthlyBillRepository.searchBills(month, year, customerId, status, pageable)
                .map(this::toDto);
    }

    public MonthlyBill getBillById(Long id) {
        return monthlyBillRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill with ID " + id + " not found"));
    }

    public MonthlyBillDto toDto(MonthlyBill b) {
        return new MonthlyBillDto(
                b.getId(),
                b.getCustomer().getId(),
                b.getCustomer().getCustomerCode(),
                b.getCustomer().getName(),
                b.getCustomer().getPhone(),
                b.getBillingMonth(),
                b.getBillingYear(),
                b.getMilkMorningLitres(),
                b.getMilkEveningLitres(),
                b.getMilkTotalLitres(),
                b.getMorningTotal(),
                b.getEveningTotal(),
                b.getMilkTotalAmount(),
                b.getProductTotal(),
                b.getGrandTotal(),
                b.getBillStatus(),
                b.getPdfPath(),
                b.getGeneratedAt(),
                b.getFinalizedAt()
        );
    }
}

