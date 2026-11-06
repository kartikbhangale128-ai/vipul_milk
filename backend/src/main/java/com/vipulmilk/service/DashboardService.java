package com.vipulmilk.service;

import com.vipulmilk.dto.DashboardStatsResponse;
import com.vipulmilk.entity.MilkEntry;
import com.vipulmilk.entity.ProductEntry;
import com.vipulmilk.repository.CustomerRepository;
import com.vipulmilk.repository.MilkEntryRepository;
import com.vipulmilk.repository.ProductEntryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final CustomerRepository customerRepository;
    private final MilkEntryRepository milkEntryRepository;
    private final ProductEntryRepository productEntryRepository;
    private final MilkRateService milkRateService;

    public DashboardService(CustomerRepository customerRepository,
                            MilkEntryRepository milkEntryRepository,
                            ProductEntryRepository productEntryRepository,
                            MilkRateService milkRateService) {
        this.customerRepository = customerRepository;
        this.milkEntryRepository = milkEntryRepository;
        this.productEntryRepository = productEntryRepository;
        this.milkRateService = milkRateService;
    }

    public DashboardStatsResponse getDashboardStats() {
        LocalDate today = LocalDate.now();
        YearMonth currentYearMonth = YearMonth.now();
        LocalDate monthStart = currentYearMonth.atDay(1);
        LocalDate monthEnd = currentYearMonth.atEndOfMonth();

        long activeCustomers = customerRepository.countByActiveTrue();

        BigDecimal todayMorning = milkEntryRepository.sumMorningLitresForDate(today);
        BigDecimal todayEvening = milkEntryRepository.sumEveningLitresForDate(today);
        BigDecimal todayTotal = todayMorning.add(todayEvening);

        BigDecimal currentRate = milkRateService.getCurrentRate().ratePerLitre();

        BigDecimal monthMilkSales = milkEntryRepository.sumTotalMilkAmountBetween(monthStart, monthEnd);
        BigDecimal monthProdSales = productEntryRepository.sumTotalProductAmountBetween(monthStart, monthEnd);
        BigDecimal estimatedBilling = monthMilkSales.add(monthProdSales);

        // Recent activity
        List<DashboardStatsResponse.RecentActivityItem> recent = new ArrayList<>();

        List<MilkEntry> recentMilk = milkEntryRepository.findTop10ByOrderByUpdatedAtDesc();
        for (MilkEntry m : recentMilk) {
            recent.add(new DashboardStatsResponse.RecentActivityItem(
                    "MILK_ENTRY",
                    String.format("%s: %.2f L (Morning: %.2f, Evening: %.2f) on %s",
                            m.getCustomer().getName(),
                            m.getMorningLitres().add(m.getEveningLitres()),
                            m.getMorningLitres(),
                            m.getEveningLitres(),
                            m.getEntryDate()),
                    m.getUpdatedAt().toLocalDate().toString()
            ));
        }

        List<ProductEntry> recentProd = productEntryRepository.findTop10ByOrderByUpdatedAtDesc();
        for (ProductEntry p : recentProd) {
            recent.add(new DashboardStatsResponse.RecentActivityItem(
                    "PRODUCT_PURCHASE",
                    String.format("%s bought %.2f %s of %s for ₹%.2f on %s",
                            p.getCustomer().getName(),
                            p.getQuantity(),
                            p.getProduct().getUnit(),
                            p.getProduct().getName(),
                            p.getTotalAmount(),
                            p.getPurchaseDate()),
                    p.getUpdatedAt().toLocalDate().toString()
            ));
        }

        return new DashboardStatsResponse(
                activeCustomers,
                todayMorning,
                todayEvening,
                todayTotal,
                currentRate,
                monthMilkSales,
                monthProdSales,
                estimatedBilling,
                recent
        );
    }
}

