package com.vipulmilk.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsResponse(
    long totalActiveCustomers,
    BigDecimal todayMorningLitres,
    BigDecimal todayEveningLitres,
    BigDecimal todayTotalLitres,
    BigDecimal currentMilkRate,
    BigDecimal currentMonthMilkSales,
    BigDecimal currentMonthProductSales,
    BigDecimal currentMonthEstimatedBilling,
    List<RecentActivityItem> recentActivity
) {
    public record RecentActivityItem(
        String type, // MILK_ENTRY, PRODUCT_PURCHASE, RATE_CHANGE
        String description,
        String timeAgo
    ) {}
}

