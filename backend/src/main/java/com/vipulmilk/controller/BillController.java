package com.vipulmilk.controller;

import com.vipulmilk.dto.BillPreviewResponse;
import com.vipulmilk.dto.MonthlyBillDto;
import com.vipulmilk.entity.MonthlyBill;
import com.vipulmilk.service.BillingService;
import com.vipulmilk.service.PdfBillService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Month;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bills")
public class BillController {

    private final BillingService billingService;
    private final PdfBillService pdfBillService;

    public BillController(BillingService billingService, PdfBillService pdfBillService) {
        this.billingService = billingService;
        this.pdfBillService = pdfBillService;
    }

    @GetMapping("/preview")
    public ResponseEntity<BillPreviewResponse> getBillPreview(
            @RequestParam int month,
            @RequestParam int year) {
        return ResponseEntity.ok(billingService.generatePreview(month, year));
    }

    @GetMapping("/customer/{customerId}/pdf")
    public ResponseEntity<byte[]> downloadIndividualCustomerPdf(
            @PathVariable Long customerId,
            @RequestParam int month,
            @RequestParam int year) throws IOException {
        com.vipulmilk.dto.BillCalculationResult calc = billingService.calculateSingleCustomerBill(customerId, month, year);
        byte[] pdf = pdfBillService.generateLiveCustomerBillPdf(calc);

        String monthName = Month.of(month).name();
        String cleanName = calc.customerName().replaceAll("[^a-zA-Z0-9_-]", "_");
        String filename = String.format("%s_%d_%s.pdf", monthName, year, cleanName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @PostMapping("/finalize")
    public ResponseEntity<List<MonthlyBillDto>> finalizeBills(@RequestBody Map<String, Integer> request) {
        int month = request.get("month");
        int year = request.get("year");
        return ResponseEntity.ok(billingService.finalizeBills(month, year));
    }

    @GetMapping
    public ResponseEntity<Page<MonthlyBillDto>> searchBills(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) MonthlyBill.BillStatus status,
            @PageableDefault(size = 20, sort = "billingYear", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(billingService.searchBills(month, year, customerId, status, pageable));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadBillPdf(@PathVariable Long id) throws IOException {
        MonthlyBill bill = billingService.getBillById(id);
        com.vipulmilk.dto.BillCalculationResult calc = billingService.calculateSingleCustomerBill(bill.getCustomer().getId(), bill.getBillingMonth(), bill.getBillingYear());
        byte[] pdf = pdfBillService.generateLiveCustomerBillPdf(calc);

        String monthName = Month.of(bill.getBillingMonth()).name();
        String cleanName = bill.getCustomer().getName().replaceAll("[^a-zA-Z0-9_-]", "_");
        String filename = String.format("%s_%d_%s.pdf", monthName, bill.getBillingYear(), cleanName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/zip")
    public ResponseEntity<byte[]> downloadBillsZip(
            @RequestParam int month,
            @RequestParam int year) throws IOException {
        com.vipulmilk.dto.BillPreviewResponse preview = billingService.generatePreview(month, year);
        byte[] zipBytes = pdfBillService.generateAllCustomerBillsZip(month, year, preview.bills());
        String monthName = Month.of(month).name();
        String filename = String.format("%s_%d_All_Bills.zip", monthName, year);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }
}

