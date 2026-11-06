package com.vipulmilk.repository;

import com.vipulmilk.entity.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByCustomerCode(String customerCode);

    boolean existsByCustomerCode(String customerCode);

    List<Customer> findByActiveTrueOrderBySortOrderAscNameAsc();

    List<Customer> findByActiveTrueOrderByNameAsc();

    @Query("SELECT c FROM Customer c WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "c.phone LIKE CONCAT('%', :query, '%') OR " +
           "LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:routeShift IS NULL OR :routeShift = '' OR LOWER(c.deliveryPerson) = LOWER(:routeShift)) AND " +
           "(:activeOnly IS NULL OR c.active = :activeOnly)")
    Page<Customer> searchCustomers(@Param("query") String query, 
                                  @Param("routeShift") String routeShift,
                                  @Param("activeOnly") Boolean activeOnly, 
                                  Pageable pageable);

    long countByActiveTrue();
}

