package com.vipulmilk.repository;

import com.vipulmilk.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrueOrderByNameAsc();
    List<Product> findAllByOrderByNameAsc();
    boolean existsByNameIgnoreCase(String name);
}

