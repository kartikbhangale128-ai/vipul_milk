package com.vipulmilk.repository;

import com.vipulmilk.entity.ProductEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductEntryRepository extends JpaRepository<ProductEntry, Long> {

    @Query("SELECT p FROM ProductEntry p JOIN FETCH p.customer c JOIN FETCH p.product pr " +
           "WHERE (:customerId IS NULL OR p.customer.id = :customerId) AND " +
           "(:productId IS NULL OR p.product.id = :productId) AND " +
           "(cast(:startDate as date) IS NULL OR p.purchaseDate >= :startDate) AND " +
           "(cast(:endDate as date) IS NULL OR p.purchaseDate <= :endDate) " +
           "ORDER BY p.purchaseDate DESC, p.id DESC")
    Page<ProductEntry> searchEntries(@Param("customerId") Long customerId,
                                     @Param("productId") Long productId,
                                     @Param("startDate") LocalDate startDate,
                                     @Param("endDate") LocalDate endDate,
                                     Pageable pageable);

    @Query("SELECT p FROM ProductEntry p JOIN FETCH p.customer c JOIN FETCH p.product pr " +
           "WHERE p.purchaseDate BETWEEN :startDate AND :endDate " +
           "ORDER BY p.purchaseDate ASC")
    List<ProductEntry> findEntriesInDateRange(@Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    @Query("SELECT p FROM ProductEntry p JOIN FETCH p.product pr " +
           "WHERE p.customer.id = :customerId AND p.purchaseDate BETWEEN :startDate AND :endDate " +
           "ORDER BY p.purchaseDate ASC")
    List<ProductEntry> findByCustomerIdAndDateRange(@Param("customerId") Long customerId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);

    Page<ProductEntry> findByCustomerIdOrderByPurchaseDateDesc(Long customerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM ProductEntry p WHERE p.purchaseDate BETWEEN :startDate AND :endDate")
    BigDecimal sumTotalProductAmountBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    List<ProductEntry> findTop10ByOrderByUpdatedAtDesc();
}

