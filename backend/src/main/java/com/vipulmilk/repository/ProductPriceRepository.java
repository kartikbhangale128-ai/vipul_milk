package com.vipulmilk.repository;

import com.vipulmilk.entity.Product;
import com.vipulmilk.entity.ProductPrice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductPriceRepository extends JpaRepository<ProductPrice, Long> {

    List<ProductPrice> findByProductOrderByEffectiveFromDesc(Product product);

    boolean existsByProductAndEffectiveFrom(Product product, LocalDate effectiveFrom);

    /**
     * Finds the latest product price where effective_from <= date
     */
    @Query("SELECT p FROM ProductPrice p WHERE p.product = :product AND p.effectiveFrom <= :date ORDER BY p.effectiveFrom DESC LIMIT 1")
    Optional<ProductPrice> findApplicablePrice(@Param("product") Product product, @Param("date") LocalDate date);

    @Query("SELECT p FROM ProductPrice p WHERE p.product.id = :productId AND p.effectiveFrom <= :date ORDER BY p.effectiveFrom DESC LIMIT 1")
    Optional<ProductPrice> findApplicablePriceByProductId(@Param("productId") Long productId, @Param("date") LocalDate date);
}

