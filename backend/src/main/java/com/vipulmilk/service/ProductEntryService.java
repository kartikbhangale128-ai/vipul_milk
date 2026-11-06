package com.vipulmilk.service;

import com.vipulmilk.dto.ProductEntryDto;
import com.vipulmilk.dto.ProductEntryRequest;
import com.vipulmilk.entity.Customer;
import com.vipulmilk.entity.Product;
import com.vipulmilk.entity.ProductEntry;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.CustomerRepository;
import com.vipulmilk.repository.ProductEntryRepository;
import com.vipulmilk.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class ProductEntryService {

    private final ProductEntryRepository productEntryRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;

    public ProductEntryService(ProductEntryRepository productEntryRepository,
                               CustomerRepository customerRepository,
                               ProductRepository productRepository,
                               ProductService productService) {
        this.productEntryRepository = productEntryRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.productService = productService;
    }

    public Page<ProductEntryDto> searchEntries(Long customerId, Long productId, LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return productEntryRepository.searchEntries(customerId, productId, startDate, endDate, pageable)
                .map(this::toDto);
    }

    public Page<ProductEntryDto> getCustomerProductEntries(Long customerId, Pageable pageable) {
        return productEntryRepository.findByCustomerIdOrderByPurchaseDateDesc(customerId, pageable)
                .map(this::toDto);
    }

    @Transactional
    public ProductEntryDto createEntry(ProductEntryRequest request) {
        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + request.customerId() + " not found"));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + request.productId() + " not found"));

        // CRITICAL BUSINESS RULE: Resolve unit price authoritative on backend by purchase date
        BigDecimal unitPrice = productService.getApplicablePrice(product.getId(), request.purchaseDate());
        BigDecimal totalAmount = unitPrice.multiply(request.quantity()).setScale(2, RoundingMode.HALF_UP);

        ProductEntry entry = new ProductEntry();
        entry.setCustomer(customer);
        entry.setProduct(product);
        entry.setPurchaseDate(request.purchaseDate());
        entry.setQuantity(request.quantity());
        entry.setUnitPrice(unitPrice);
        entry.setTotalAmount(totalAmount);
        entry.setNotes(request.notes() != null ? request.notes().trim() : null);

        ProductEntry saved = productEntryRepository.save(entry);
        return toDto(saved);
    }

    @Transactional
    public ProductEntryDto updateEntry(Long id, ProductEntryRequest request) {
        ProductEntry entry = productEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product purchase with ID " + id + " not found"));

        Customer customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer with ID " + request.customerId() + " not found"));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + request.productId() + " not found"));

        // Re-resolve price if purchaseDate or product changed
        BigDecimal unitPrice = productService.getApplicablePrice(product.getId(), request.purchaseDate());
        BigDecimal totalAmount = unitPrice.multiply(request.quantity()).setScale(2, RoundingMode.HALF_UP);

        entry.setCustomer(customer);
        entry.setProduct(product);
        entry.setPurchaseDate(request.purchaseDate());
        entry.setQuantity(request.quantity());
        entry.setUnitPrice(unitPrice);
        entry.setTotalAmount(totalAmount);
        entry.setNotes(request.notes() != null ? request.notes().trim() : null);

        ProductEntry updated = productEntryRepository.save(entry);
        return toDto(updated);
    }

    @Transactional
    public void deleteEntry(Long id) {
        if (!productEntryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product purchase with ID " + id + " not found");
        }
        productEntryRepository.deleteById(id);
    }

    public ProductEntryDto toDto(ProductEntry p) {
        return new ProductEntryDto(
                p.getId(),
                p.getCustomer().getId(),
                p.getCustomer().getCustomerCode(),
                p.getCustomer().getName(),
                p.getProduct().getId(),
                p.getProduct().getName(),
                p.getProduct().getUnit(),
                p.getPurchaseDate(),
                p.getQuantity(),
                p.getUnitPrice(),
                p.getTotalAmount(),
                p.getNotes(),
                p.getUpdatedAt()
        );
    }
}

