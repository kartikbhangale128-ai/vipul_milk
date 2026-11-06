package com.vipulmilk.service;

import com.vipulmilk.dto.CustomerDto;
import com.vipulmilk.dto.CustomerRequest;
import com.vipulmilk.entity.Customer;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.CustomerRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Page<CustomerDto> getCustomers(String query, String routeShift, Boolean activeOnly, Pageable pageable) {
        return customerRepository.searchCustomers(query, routeShift, activeOnly, pageable)
                .map(this::toDto);
    }

    public List<CustomerDto> getAllActiveCustomers() {
        return customerRepository.findByActiveTrueOrderBySortOrderAscNameAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + id + " not found"));
        return toDto(customer);
    }

    @Transactional
    public CustomerDto createCustomer(CustomerRequest request) {
        Customer customer = new Customer();
        customer.setName(request.name().trim());
        customer.setPhone(request.phone() != null ? request.phone().trim() : null);
        customer.setAddress(request.address() != null ? request.address().trim() : null);
        customer.setDeliveryPerson(request.deliveryPerson() != null && !request.deliveryPerson().isBlank() ? request.deliveryPerson().trim() : "Ajay");
        customer.setDefaultMorningLitres(request.defaultMorningLitres() != null ? request.defaultMorningLitres() : java.math.BigDecimal.ZERO);
        customer.setDefaultEveningLitres(request.defaultEveningLitres() != null ? request.defaultEveningLitres() : java.math.BigDecimal.ZERO);
        customer.setActive(true);
        // Temporary unique code prior to DB insert, then updated to CUST-{id}
        customer.setCustomerCode("CUST-TEMP-" + UUID.randomUUID().toString().substring(0, 8));

        Customer saved = customerRepository.save(customer);
        saved.setCustomerCode(String.format("CUST-%03d", saved.getId()));
        customerRepository.save(saved);

        return toDto(saved);
    }

    @Transactional
    public CustomerDto updateCustomer(Long id, CustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + id + " not found"));

        customer.setName(request.name().trim());
        customer.setPhone(request.phone() != null ? request.phone().trim() : null);
        customer.setAddress(request.address() != null ? request.address().trim() : null);
        if (request.deliveryPerson() != null && !request.deliveryPerson().isBlank()) {
            customer.setDeliveryPerson(request.deliveryPerson().trim());
        }
        if (request.defaultMorningLitres() != null) {
            customer.setDefaultMorningLitres(request.defaultMorningLitres());
        }
        if (request.defaultEveningLitres() != null) {
            customer.setDefaultEveningLitres(request.defaultEveningLitres());
        }

        Customer updated = customerRepository.save(customer);
        return toDto(updated);
    }

    @Transactional
    public CustomerDto toggleCustomerStatus(Long id, boolean active) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + id + " not found"));
        customer.setActive(active);
        return toDto(customerRepository.save(customer));
    }

    public long countActiveCustomers() {
        return customerRepository.countByActiveTrue();
    }

    @Transactional
    public void reorderCustomers(List<Long> customerIds) {
        if (customerIds == null || customerIds.isEmpty()) return;
        for (int i = 0; i < customerIds.size(); i++) {
            Long id = customerIds.get(i);
            customerRepository.findById(id).ifPresent(c -> {
                c.setSortOrder(id != null ? customerIds.indexOf(id) : 0);
                customerRepository.save(c);
            });
        }
    }

    public CustomerDto toDto(Customer customer) {
        return new CustomerDto(
                customer.getId(),
                customer.getCustomerCode(),
                customer.getName(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getDeliveryPerson() != null ? customer.getDeliveryPerson() : "Ajay",
                customer.getSortOrder(),
                customer.getDefaultMorningLitres(),
                customer.getDefaultEveningLitres(),
                customer.isActive(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }
}

