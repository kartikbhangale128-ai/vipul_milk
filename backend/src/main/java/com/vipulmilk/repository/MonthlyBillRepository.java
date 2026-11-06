package com.vipulmilk.repository;

import com.vipulmilk.entity.MonthlyBill;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface MonthlyBillRepository extends JpaRepository<MonthlyBill, Long> {

    Optional<MonthlyBill> findByCustomerIdAndBillingMonthAndBillingYear(Long customerId, Integer billingMonth, Integer billingYear);

    List<MonthlyBill> findByBillingMonthAndBillingYearOrderByCustomerName(Integer billingMonth, Integer billingYear);

    @Query("SELECT b FROM MonthlyBill b JOIN FETCH b.customer c " +
           "WHERE b.billingMonth = :month AND b.billingYear = :year " +
           "ORDER BY c.name ASC")
    List<MonthlyBill> findAllByMonthAndYearWithCustomer(@Param("month") Integer month, @Param("year") Integer year);

    @Query("SELECT b FROM MonthlyBill b JOIN FETCH b.customer c " +
           "WHERE (:month IS NULL OR b.billingMonth = :month) AND " +
           "(:year IS NULL OR b.billingYear = :year) AND " +
           "(:customerId IS NULL OR b.customer.id = :customerId) AND " +
           "(:status IS NULL OR b.billStatus = :status) " +
           "ORDER BY b.billingYear DESC, b.billingMonth DESC, c.name ASC")
    Page<MonthlyBill> searchBills(@Param("month") Integer month,
                                 @Param("year") Integer year,
                                 @Param("customerId") Long customerId,
                                 @Param("status") MonthlyBill.BillStatus status,
                                 Pageable pageable);

    Page<MonthlyBill> findByCustomerIdOrderByBillingYearDescBillingMonthDesc(Long customerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(b.grandTotal), 0) FROM MonthlyBill b WHERE b.billingMonth = :month AND b.billingYear = :year")
    BigDecimal sumGrandTotalForMonthAndYear(@Param("month") Integer month, @Param("year") Integer year);
}

