package com.vipulmilk.service;

import com.vipulmilk.dto.MilkRateDto;
import com.vipulmilk.dto.MilkRateRequest;
import com.vipulmilk.entity.MilkRate;
import com.vipulmilk.exception.BusinessRuleException;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.MilkRateRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class MilkRateService {

    private final MilkRateRepository milkRateRepository;

    public MilkRateService(MilkRateRepository milkRateRepository) {
        this.milkRateRepository = milkRateRepository;
    }

    @PostConstruct
    @Transactional
    public void initInitialRate() {
        if (milkRateRepository.count() == 0) {
            // Seed a sensible starting rate: ₹60/litre from 2026-01-01
            MilkRate rate = new MilkRate(
                    BigDecimal.valueOf(60.00),
                    LocalDate.of(2026, 1, 1),
                    "Initial standard milk rate"
            );
            milkRateRepository.save(rate);
        }
    }

    public List<MilkRateDto> getAllRates() {
        return milkRateRepository.findAllByOrderByEffectiveFromDesc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public MilkRateDto getCurrentRate() {
        return milkRateRepository.findApplicableRate(LocalDate.now())
                .map(this::toDto)
                .orElseThrow(() -> new ResourceNotFoundException("No applicable milk rate found for today"));
    }

    public MilkRate getApplicableRateForDate(LocalDate date) {
        return milkRateRepository.findApplicableRate(date)
                .orElseThrow(() -> new BusinessRuleException(
                        "No milk rate defined on or before date: " + date + 
                        ". Please configure a milk rate effective on or prior to this date."));
    }

    @Transactional
    public MilkRateDto addRate(MilkRateRequest request) {
        if (milkRateRepository.existsByEffectiveFrom(request.effectiveFrom())) {
            throw new BusinessRuleException("A milk rate with effective date " + request.effectiveFrom() + " already exists. Historical rates cannot be overwritten.");
        }

        MilkRate rate = new MilkRate(
                request.ratePerLitre(),
                request.effectiveFrom(),
                request.note() != null ? request.note().trim() : null
        );

        MilkRate saved = milkRateRepository.save(rate);
        return toDto(saved);
    }

    public MilkRateDto toDto(MilkRate rate) {
        return new MilkRateDto(
                rate.getId(),
                rate.getRatePerLitre(),
                rate.getEffectiveFrom(),
                rate.getNote(),
                rate.getCreatedAt()
        );
    }
}

