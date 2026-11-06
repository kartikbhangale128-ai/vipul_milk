package com.vipulmilk.service;

import com.vipulmilk.dto.AddProductPriceRequest;
import com.vipulmilk.dto.CreateProductRequest;
import com.vipulmilk.dto.ProductDto;
import com.vipulmilk.dto.ProductPriceDto;
import com.vipulmilk.entity.Product;
import com.vipulmilk.entity.ProductPrice;
import com.vipulmilk.exception.BusinessRuleException;
import com.vipulmilk.exception.ResourceNotFoundException;
import com.vipulmilk.repository.ProductPriceRepository;
import com.vipulmilk.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductPriceRepository productPriceRepository;

    public ProductService(ProductRepository productRepository, ProductPriceRepository productPriceRepository) {
        this.productRepository = productRepository;
        this.productPriceRepository = productPriceRepository;
    }

    @PostConstruct
    @Transactional
    public void initDefaultProducts() {
        if (productRepository.count() == 0) {
            LocalDate date = LocalDate.of(2026, 1, 1);
            createInitialProduct("Paneer", "kg", BigDecimal.valueOf(400.00), date);
            createInitialProduct("Basundi", "kg", BigDecimal.valueOf(250.00), date);
            createInitialProduct("Khava (Mawa)", "kg", BigDecimal.valueOf(360.00), date);
            createInitialProduct("Ghee", "kg", BigDecimal.valueOf(650.00), date);
            createInitialProduct("Curd (Dahi)", "kg", BigDecimal.valueOf(70.00), date);
            createInitialProduct("Butter", "kg", BigDecimal.valueOf(500.00), date);
        }
    }

    private void createInitialProduct(String name, String unit, BigDecimal price, LocalDate date) {
        Product product = new Product(name, unit);
        product = productRepository.save(product);
        ProductPrice pPrice = new ProductPrice(product, price, date);
        productPriceRepository.save(pPrice);
    }

    public List<ProductDto> getAllProducts(boolean includeInactive) {
        List<Product> products = includeInactive 
                ? productRepository.findAllByOrderByNameAsc()
                : productRepository.findByActiveTrueOrderByNameAsc();

        return products.stream()
                .map(this::toDetailedDto)
                .toList();
    }

    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));
        return toDetailedDto(product);
    }

    @Transactional
    public ProductDto createProduct(CreateProductRequest request) {
        if (productRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw new BusinessRuleException("A product with name '" + request.name() + "' already exists");
        }

        Product product = new Product(request.name().trim(), request.unit().trim().toLowerCase());
        Product saved = productRepository.save(product);

        ProductPrice price = new ProductPrice(saved, request.initialPrice(), request.effectiveFrom());
        productPriceRepository.save(price);

        return toDetailedDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(Long id, String name, String unit) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));

        product.setName(name.trim());
        product.setUnit(unit.trim().toLowerCase());
        return toDetailedDto(productRepository.save(product));
    }

    @Transactional
    public ProductDto toggleProductStatus(Long id, boolean active) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + id + " not found"));
        product.setActive(active);
        return toDetailedDto(productRepository.save(product));
    }

    @Transactional
    public ProductPriceDto addProductPrice(Long productId, AddProductPriceRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product with ID " + productId + " not found"));

        if (productPriceRepository.existsByProductAndEffectiveFrom(product, request.effectiveFrom())) {
            throw new BusinessRuleException("A price for this product on " + request.effectiveFrom() + " already exists. Historical prices cannot be overwritten.");
        }

        ProductPrice price = new ProductPrice(product, request.price(), request.effectiveFrom());
        ProductPrice saved = productPriceRepository.save(price);

        return toPriceDto(saved);
    }

    public BigDecimal getApplicablePrice(Long productId, LocalDate date) {
        ProductPrice price = productPriceRepository.findApplicablePriceByProductId(productId, date)
                .orElseThrow(() -> new BusinessRuleException(
                        "No price found for product on or before " + date + 
                        ". Please configure a product price effective on or prior to this date."));
        return price.getPrice();
    }

    public ProductPriceDto toPriceDto(ProductPrice p) {
        return new ProductPriceDto(
                p.getId(),
                p.getProduct().getId(),
                p.getProduct().getName(),
                p.getPrice(),
                p.getEffectiveFrom(),
                p.getCreatedAt()
        );
    }

    public ProductDto toDetailedDto(Product product) {
        List<ProductPrice> prices = productPriceRepository.findByProductOrderByEffectiveFromDesc(product);
        List<ProductPriceDto> priceDtos = prices.stream().map(this::toPriceDto).toList();

        Optional<ProductPrice> currentPrice = productPriceRepository.findApplicablePrice(product, LocalDate.now());

        return new ProductDto(
                product.getId(),
                product.getName(),
                product.getUnit(),
                product.isActive(),
                currentPrice.map(ProductPrice::getPrice).orElse(BigDecimal.ZERO),
                currentPrice.map(ProductPrice::getEffectiveFrom).orElse(null),
                priceDtos,
                product.getCreatedAt()
        );
    }
}

