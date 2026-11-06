package com.vipulmilk;

import com.vipulmilk.dto.*;
import com.vipulmilk.entity.*;
import com.vipulmilk.repository.*;
import com.vipulmilk.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class VipulMilkBusinessRulesTest {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private MilkRateService milkRateService;

    @Autowired
    private ProductService productService;

    @Autowired
    private MilkEntryService milkEntryService;

    @Autowired
    private ProductEntryService productEntryService;

    @Autowired
    private BillingService billingService;

    @Autowired
    private PdfBillService pdfBillService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private MilkRateRepository milkRateRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductPriceRepository productPriceRepository;

    @Autowired
    private MilkEntryRepository milkEntryRepository;

    @Autowired
    private ProductEntryRepository productEntryRepository;

    @Autowired
    private MonthlyBillRepository monthlyBillRepository;

    @Test
    public void testCustomerLifecycleAndDeactivationHistoryPreservation() {
        CustomerDto customer = customerService.createCustomer(new CustomerRequest(
                "Ramesh Test Patil", "9876500001", "Sector 4, Dairy colony"
        ));
        assertNotNull(customer.id());
        assertTrue(customer.active());

        // Update customer
        CustomerDto updated = customerService.updateCustomer(customer.id(), new CustomerRequest(
                "Ramesh P. Patil", "9876500002", "Sector 5, New Colony"
        ));
        assertEquals("Ramesh P. Patil", updated.name());
        assertEquals("9876500002", updated.phone());

        // Deactivate customer (Soft delete)
        CustomerDto deactivated = customerService.toggleCustomerStatus(customer.id(), false);
        assertFalse(deactivated.active());

        // Historical record still exists and retrievable
        CustomerDto retrieved = customerService.getCustomerById(customer.id());
        assertNotNull(retrieved);
        assertFalse(retrieved.active());
    }

    @Test
    public void testMilkRateHistoricalVersioningAndLookup() {
        // Current baseline rates might exist from @PostConstruct (e.g. 60.00 on 2026-01-01)
        LocalDate novDate = LocalDate.of(2026, 11, 1);
        if (!milkRateRepository.existsByEffectiveFrom(novDate)) {
            milkRateService.addRate(new MilkRateRequest(BigDecimal.valueOf(62.50), novDate, "Winter rate"));
        }

        LocalDate decDate = LocalDate.of(2026, 12, 1);
        if (!milkRateRepository.existsByEffectiveFrom(decDate)) {
            milkRateService.addRate(new MilkRateRequest(BigDecimal.valueOf(65.00), decDate, "December revision"));
        }

        // Check applicable rate on 15 Nov 2026 -> Must be 62.50
        MilkRate rateMidNov = milkRateService.getApplicableRateForDate(LocalDate.of(2026, 11, 15));
        assertEquals(0, BigDecimal.valueOf(62.50).compareTo(rateMidNov.getRatePerLitre()));

        // Check applicable rate on 05 Dec 2026 -> Must be 65.00
        MilkRate rateDec = milkRateService.getApplicableRateForDate(LocalDate.of(2026, 12, 5));
        assertEquals(0, BigDecimal.valueOf(65.00).compareTo(rateDec.getRatePerLitre()));
    }

    @Test
    public void testDailyMilkEntryAndBulkSaving() {
        CustomerDto c1 = customerService.createCustomer(new CustomerRequest("Customer Alpha", "9991110001", "Address 1"));
        CustomerDto c2 = customerService.createCustomer(new CustomerRequest("Customer Beta", "9991110002", "Address 2"));

        LocalDate date = LocalDate.of(2026, 11, 10);
        BulkMilkEntryRequest bulkRequest = new BulkMilkEntryRequest(List.of(
                new SingleMilkEntryItem(c1.id(), date, BigDecimal.valueOf(1.5), BigDecimal.valueOf(1.0)),
                new SingleMilkEntryItem(c2.id(), date, BigDecimal.valueOf(2.0), BigDecimal.valueOf(0.5))
        ));

        List<MilkEntryDto> saved = milkEntryService.bulkSaveEntries(bulkRequest);
        assertEquals(2, saved.size());

        // Verify calculation: Customer Alpha took 1.5 + 1.0 = 2.5 L at 62.50
        MilkEntryDto alphaEntry = saved.stream().filter(e -> e.customerId().equals(c1.id())).findFirst().orElseThrow();
        assertEquals(0, BigDecimal.valueOf(2.5).compareTo(alphaEntry.totalLitres()));
        BigDecimal expectedAlphaTotal = BigDecimal.valueOf(2.5).multiply(alphaEntry.milkRate());
        assertEquals(0, expectedAlphaTotal.compareTo(alphaEntry.totalAmount()));
    }

    @Test
    public void testProductPurchasePriceFreezing() {
        String uniqueProdName = "Special Butter " + System.currentTimeMillis();
        CustomerDto c = customerService.createCustomer(new CustomerRequest("Product Buyer", "9992220003", "Address"));
        ProductDto p = productService.createProduct(new CreateProductRequest(
                uniqueProdName, "kg", BigDecimal.valueOf(500.00), LocalDate.of(2026, 10, 1)
        ));

        // Purchase on 2026-10-15
        ProductEntryDto purchase1 = productEntryService.createEntry(new ProductEntryRequest(
                c.id(), p.id(), LocalDate.of(2026, 10, 15), BigDecimal.valueOf(2), "Diwali special"
        ));
        assertEquals(0, BigDecimal.valueOf(1000.00).compareTo(purchase1.totalAmount()));

        // Now price changes in November to 550.00
        productService.addProductPrice(p.id(), new AddProductPriceRequest(
                BigDecimal.valueOf(550.00), LocalDate.of(2026, 11, 1)
        ));

        // Verify purchase1 from October still has unit price 500 and total 1000
        ProductEntry reloadedPurchase = productEntryRepository.findById(purchase1.id()).orElseThrow();
        assertEquals(0, BigDecimal.valueOf(500.00).compareTo(reloadedPurchase.getUnitPrice()));
        assertEquals(0, BigDecimal.valueOf(1000.00).compareTo(reloadedPurchase.getTotalAmount()));
    }

    @Test
    public void testMonthlyBillGenerationAndFinalization() throws IOException {
        CustomerDto c = customerService.createCustomer(new CustomerRequest("Billing Customer", "9993330004", "Lane 2"));

        // Enter milk for 2 days in November
        LocalDate d1 = LocalDate.of(2026, 11, 1);
        LocalDate d2 = LocalDate.of(2026, 11, 2);

        milkEntryService.bulkSaveEntries(new BulkMilkEntryRequest(List.of(
                new SingleMilkEntryItem(c.id(), d1, BigDecimal.valueOf(1.0), BigDecimal.valueOf(1.0)),
                new SingleMilkEntryItem(c.id(), d2, BigDecimal.valueOf(2.0), BigDecimal.valueOf(1.0))
        )));

        // Preview bills
        BillPreviewResponse preview = billingService.generatePreview(11, 2026);
        assertNotNull(preview);
        assertTrue(preview.totalBills() >= 1);

        // Finalize bills
        List<MonthlyBillDto> finalizedBills = billingService.finalizeBills(11, 2026);
        MonthlyBillDto myBill = finalizedBills.stream().filter(b -> b.customerId().equals(c.id())).findFirst().orElseThrow();
        assertEquals(MonthlyBill.BillStatus.FINALIZED, myBill.billStatus());
        assertTrue(myBill.grandTotal().compareTo(BigDecimal.ZERO) > 0);

        // Test PDF generation for this finalized bill
        byte[] pdfBytes = pdfBillService.generateOrGetBillPdf(myBill.id());
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 100);

        // Test ZIP archive generation
        byte[] zipBytes = pdfBillService.generateAllBillsZip(11, 2026);
        assertNotNull(zipBytes);
        assertTrue(zipBytes.length > 100);
    }
}

