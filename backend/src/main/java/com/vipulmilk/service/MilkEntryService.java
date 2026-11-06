package com.vipulmilk.service;

import com.vipulmilk.dto.BulkMilkEntryRequest;
import com.vipulmilk.dto.MilkEntryDto;
import com.vipulmilk.dto.SingleMilkEntryItem;
import com.vipulmilk.entity.Customer;
import com.vipulmilk.entity.MilkEntry;
import com.vipulmilk.entity.MilkRate;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.CustomerRepository;
import com.vipulmilk.repository.MilkEntryRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MilkEntryService {

    private final MilkEntryRepository milkEntryRepository;
    private final CustomerRepository customerRepository;
    private final MilkRateService milkRateService;

    public MilkEntryService(MilkEntryRepository milkEntryRepository,
                            CustomerRepository customerRepository,
                            MilkRateService milkRateService) {
        this.milkEntryRepository = milkEntryRepository;
        this.customerRepository = customerRepository;
        this.milkRateService = milkRateService;
    }

    public List<MilkEntryDto> getEntriesForGrid(LocalDate startDate, LocalDate endDate, List<Long> customerIds) {
        List<MilkEntry> entries;
        if (customerIds != null && !customerIds.isEmpty()) {
            entries = milkEntryRepository.findEntriesForCustomersInDateRange(customerIds, startDate, endDate);
        } else {
            entries = milkEntryRepository.findEntriesInDateRange(startDate, endDate);
        }
        return entries.stream().map(this::toDto).toList();
    }

    public Page<MilkEntryDto> getCustomerMilkEntries(Long customerId, Pageable pageable) {
        return milkEntryRepository.findByCustomerIdOrderByEntryDateDesc(customerId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public List<MilkEntryDto> bulkSaveEntries(BulkMilkEntryRequest request) {
        if (request.entries() == null || request.entries().isEmpty()) {
            return Collections.emptyList();
        }

        // Cache customer lookups
        Set<Long> custIds = request.entries().stream()
                .map(SingleMilkEntryItem::customerId)
                .collect(Collectors.toSet());
        Map<Long, Customer> customerMap = customerRepository.findAllById(custIds).stream()
                .collect(Collectors.toMap(Customer::getId, c -> c));

        // Deduplicate request entries by (customerId, date) keeping latest in request
        Map<String, SingleMilkEntryItem> dedupedItems = new LinkedHashMap<>();
        for (SingleMilkEntryItem item : request.entries()) {
            dedupedItems.put(item.customerId() + "_" + item.date(), item);
        }

        // Find min and max dates in request to bulk load existing entries
        LocalDate minDate = null;
        LocalDate maxDate = null;
        for (SingleMilkEntryItem item : dedupedItems.values()) {
            if (minDate == null || item.date().isBefore(minDate)) minDate = item.date();
            if (maxDate == null || item.date().isAfter(maxDate)) maxDate = item.date();
        }

        // Bulk fetch existing milk entries for these customers and date range
        List<MilkEntry> existingEntries = milkEntryRepository.findEntriesForCustomersInDateRange(
                new ArrayList<>(custIds), minDate, maxDate
        );
        Map<String, MilkEntry> existingMap = existingEntries.stream()
                .collect(Collectors.toMap(e -> e.getCustomer().getId() + "_" + e.getEntryDate(), e -> e));

        // Cache applicable rates per date to avoid redundant DB queries
        Map<LocalDate, MilkRate> rateMap = new HashMap<>();
        List<MilkEntry> entriesToSave = new ArrayList<>();

        for (SingleMilkEntryItem item : dedupedItems.values()) {
            Customer customer = customerMap.get(item.customerId());
            if (customer == null) {
                throw new ResourceNotFoundException("Customer with ID " + item.customerId() + " not found");
            }

            LocalDate date = item.date();
            MilkRate rate = rateMap.computeIfAbsent(date, milkRateService::getApplicableRateForDate);

            BigDecimal morning = item.morningLitres() != null ? item.morningLitres() : BigDecimal.ZERO;
            BigDecimal evening = item.eveningLitres() != null ? item.eveningLitres() : BigDecimal.ZERO;

            // Find existing entry or create new
            MilkEntry entry = existingMap.get(item.customerId() + "_" + date);
            if (entry == null) {
                entry = new MilkEntry();
                entry.setCustomer(customer);
                entry.setEntryDate(date);
            }

            entry.setMorningLitres(morning);
            entry.setEveningLitres(evening);
            entry.setMilkRate(rate.getRatePerLitre());

            BigDecimal mAmount = morning.multiply(rate.getRatePerLitre()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal eAmount = evening.multiply(rate.getRatePerLitre()).setScale(2, RoundingMode.HALF_UP);

            entry.setMorningAmount(mAmount);
            entry.setEveningAmount(eAmount);

            entriesToSave.add(entry);
        }

        List<MilkEntry> savedEntries = milkEntryRepository.saveAll(entriesToSave);
        return savedEntries.stream().map(this::toDto).toList();
    }

    public MilkEntryDto toDto(MilkEntry m) {
        BigDecimal totalLitres = m.getMorningLitres().add(m.getEveningLitres());
        BigDecimal totalAmount = m.getMorningAmount().add(m.getEveningAmount());

        return new MilkEntryDto(
                m.getId(),
                m.getCustomer().getId(),
                m.getCustomer().getCustomerCode(),
                m.getCustomer().getName(),
                m.getEntryDate(),
                m.getMorningLitres(),
                m.getEveningLitres(),
                totalLitres,
                m.getMilkRate(),
                m.getMorningAmount(),
                m.getEveningAmount(),
                totalAmount,
                m.getUpdatedAt()
        );
    }
}

