package com.vipulmilk.repository;

import com.vipulmilk.entity.MilkRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MilkRateRepository extends JpaRepository<MilkRate, Long> {

    List<MilkRate> findAllByOrderByEffectiveFromDesc();

    boolean existsByEffectiveFrom(LocalDate effectiveFrom);

    /**
     * Finds the latest milk rate where effective_from <= entryDate
     */
    @Query("SELECT r FROM MilkRate r WHERE r.effectiveFrom <= :date ORDER BY r.effectiveFrom DESC LIMIT 1")
    Optional<MilkRate> findApplicableRate(@Param("date") LocalDate date);
}

