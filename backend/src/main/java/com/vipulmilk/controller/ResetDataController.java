package com.vipulmilk.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin-reset")
public class ResetDataController {

    @PersistenceContext
    private EntityManager entityManager;

    @PostMapping("/reset-all-data")
    @Transactional
    public ResponseEntity<Map<String, String>> resetAllData() {
        // Truncate dependent transaction tables first, then customer & product tables
        entityManager.createNativeQuery("TRUNCATE TABLE monthly_bills, product_entries, milk_entries, product_prices, products, customers CASCADE").executeUpdate();
        return ResponseEntity.ok(Map.of("message", "All customers, products, and related records cleared successfully"));
    }

    @PostMapping("/terminate-locks")
    @Transactional
    public ResponseEntity<Map<String, Object>> terminateLocks() {
        entityManager.createNativeQuery(
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity " +
            "WHERE pid <> pg_backend_pid() AND datname = current_database() " +
            "AND state IN ('idle in transaction', 'active', 'idle in transaction (aborted)')"
        ).getResultList();
        return ResponseEntity.ok(Map.of("status", "terminated other backends"));
    }
}

