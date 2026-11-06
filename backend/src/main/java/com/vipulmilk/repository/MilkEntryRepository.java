package com.vipulmilk.repository;

import com.vipulmilk.entity.Customer;
import com.vipulmilk.entity.MilkEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MilkEntryRepository extends JpaRepository<MilkEntry, Long> {

    Optional<MilkEntry> findByCustomerAndEntryDate(Customer customer, LocalDate entryDate);

    Optional<MilkEntry> findByCustomerIdAndEntryDate(Long customerId, LocalDate entryDate);

    @Query("SELECT m FROM MilkEntry m JOIN FETCH m.customer c " +
           "WHERE m.entryDate BETWEEN :startDate AND :endDate " +
           "ORDER BY m.entryDate ASC, c.name ASC")
    List<MilkEntry> findEntriesInDateRange(@Param("startDate") LocalDate startDate, 
                                          @Param("endDate") LocalDate endDate);

    @Query("SELECT m FROM MilkEntry m JOIN FETCH m.customer c " +
           "WHERE m.customer.id IN :customerIds AND m.entryDate BETWEEN :startDate AND :endDate " +
           "ORDER BY m.entryDate ASC, c.name ASC")
    List<MilkEntry> findEntriesForCustomersInDateRange(@Param("customerIds") List<Long> customerIds,
                                                      @Param("startDate") LocalDate startDate, 
                                                      @Param("endDate") LocalDate endDate);

    @Query("SELECT m FROM MilkEntry m WHERE m.customer.id = :customerId AND m.entryDate BETWEEN :startDate AND :endDate ORDER BY m.entryDate ASC")
    List<MilkEntry> findByCustomerIdAndDateRange(@Param("customerId") Long customerId, 
                                                @Param("startDate") LocalDate startDate, 
                                                @Param("endDate") LocalDate endDate);

    Page<MilkEntry> findByCustomerIdOrderByEntryDateDesc(Long customerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(m.morningLitres), 0) FROM MilkEntry m WHERE m.entryDate = :date")
    BigDecimal sumMorningLitresForDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.eveningLitres), 0) FROM MilkEntry m WHERE m.entryDate = :date")
    BigDecimal sumEveningLitresForDate(@Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.morningAmount + m.eveningAmount), 0) FROM MilkEntry m WHERE m.entryDate BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalMilkAmountBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<MilkEntry> findTop10ByOrderByUpdatedAtDesc();
}

