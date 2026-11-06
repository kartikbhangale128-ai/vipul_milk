package com.vipulmilk.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.vipulmilk.dto.BillCalculationResult;
import com.vipulmilk.entity.AppSettings;
import com.vipulmilk.entity.MonthlyBill;
import com.vipulmilk.repository.AppSettingsRepository;
import com.vipulmilk.repository.MonthlyBillRepository;
import com.vipulmilk.util.NumberToWordsConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.Month;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Transactional
public class PdfBillService {

    private static final Logger log = LoggerFactory.getLogger(PdfBillService.class);

    private final MonthlyBillRepository monthlyBillRepository;
    private final AppSettingsRepository appSettingsRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.storage.pdf-dir:./data/bills/pdf}")
    private String pdfStorageDir;

    private String cachedBannerBase64 = null;
    private String cachedQrBase64 = null;

    public PdfBillService(MonthlyBillRepository monthlyBillRepository,
                          AppSettingsRepository appSettingsRepository,
                          ObjectMapper objectMapper) {
        this.monthlyBillRepository = monthlyBillRepository;
        this.appSettingsRepository = appSettingsRepository;
        this.objectMapper = objectMapper;
    }

    private synchronized void loadAssets() {
        if (cachedBannerBase64 == null) {
            try {
                ClassPathResource bannerRes = new ClassPathResource("static/banner.png");
                if (bannerRes.exists()) {
                    byte[] bytes = bannerRes.getInputStream().readAllBytes();
                    cachedBannerBase64 = Base64.getEncoder().encodeToString(bytes);
                }
            } catch (Exception e) {
                log.warn("Could not load banner image", e);
            }
        }
        if (cachedQrBase64 == null) {
            try {
                ClassPathResource qrRes = new ClassPathResource("static/qr_code.png");
                if (qrRes.exists()) {
                    byte[] bytes = qrRes.getInputStream().readAllBytes();
                    cachedQrBase64 = Base64.getEncoder().encodeToString(bytes);
                }
            } catch (Exception e) {
                log.warn("Could not load QR image", e);
            }
        }
    }

    public byte[] generateLiveCustomerBillPdf(BillCalculationResult calc) throws IOException {
        loadAssets();
        AppSettings settings = appSettingsRepository.findById(1L).orElseGet(AppSettings::new);
        String html = buildThreeColumnBillHtml(calc, settings);
        try {
            Files.writeString(Paths.get("test_bill_debug.html"), html);
        } catch (Exception ignored) {}

        ByteArrayOutputStream os = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();

        // Register Marathi / Devanagari font
        try {
            ClassPathResource regFont = new ClassPathResource("static/NotoSansDevanagari-Regular.ttf");
            ClassPathResource boldFont = new ClassPathResource("static/NotoSansDevanagari-Bold.ttf");
            if (regFont.exists()) {
                builder.useFont(() -> {
                    try {
                        return regFont.getInputStream();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }, "Noto Sans Devanagari", 400, PdfRendererBuilder.FontStyle.NORMAL, true);
            }
            if (boldFont.exists()) {
                builder.useFont(() -> {
                    try {
                        return boldFont.getInputStream();
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }
                }, "Noto Sans Devanagari", 700, PdfRendererBuilder.FontStyle.NORMAL, true);
            }
        } catch (Exception e) {
            log.warn("Failed to register NotoSansDevanagari fonts in PDF renderer", e);
        }

        builder.withHtmlContent(html, null);
        builder.toStream(os);
        builder.run();

        return os.toByteArray();
    }

    public byte[] generateAllCustomerBillsZip(int month, int year, List<BillCalculationResult> results) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (BillCalculationResult calc : results) {
                try {
                    byte[] pdfBytes = generateLiveCustomerBillPdf(calc);
                    String safeName = calc.customerName().replaceAll("[^a-zA-Z0-9_-]", "_");
                    String filename = String.format("Bill_%s_%s_%d.pdf", calc.customerCode(), safeName, year);
                    ZipEntry entry = new ZipEntry(filename);
                    zos.putNextEntry(entry);
                    zos.write(pdfBytes);
                    zos.closeEntry();
                } catch (Exception e) {
                    log.error("Failed to generate PDF for customer in ZIP: {}", calc.customerCode(), e);
                }
            }
        }
        return baos.toByteArray();
    }

    private String buildThreeColumnBillHtml(BillCalculationResult calc, AppSettings settings) {
        int month = calc.month();
        int year = calc.year();
        YearMonth ym = YearMonth.of(year, month);
        int daysInMonth = ym.lengthOfMonth();

        String customerName = escapeXml(calc.customerName());
        String customerCode = escapeXml(calc.customerCode());
        // User requested: don't display address and phone on the bill
        String address = "";
        String phone = "";
        String contactPhone = escapeXml(settings.getContactPhone() != null && !settings.getContactPhone().isBlank() ? settings.getContactPhone() : "7588845205");

        // Map daily entries
        Map<Integer, BillCalculationResult.DailyMilkDetail> dayMap = new HashMap<>();
        BigDecimal commonRate = BigDecimal.ZERO;
        if (calc.dailyMilkDetails() != null) {
            for (BillCalculationResult.DailyMilkDetail d : calc.dailyMilkDetails()) {
                dayMap.put(d.date().getDayOfMonth(), d);
                if (d.rate() != null && d.rate().compareTo(BigDecimal.ZERO) > 0) {
                    commonRate = d.rate();
                }
            }
        }

        // Formats for date labels e.g. 1-Apr-26
        String shortMonth = Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        String yearShort = String.valueOf(year % 100);

        // Column 1: Days 1 - 10
        BigDecimal c1Morning = BigDecimal.ZERO;
        BigDecimal c1Evening = BigDecimal.ZERO;
        StringBuilder c1Rows = new StringBuilder();
        for (int day = 1; day <= 10; day++) {
            BillCalculationResult.DailyMilkDetail d = dayMap.get(day);
            String dateLabel = String.format("%d-%s-%s", day, shortMonth, yearShort);
            String amStr = "NA";
            String pmStr = "NA";
            if (d != null) {
                if (d.morningLitres() != null && d.morningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    amStr = formatQty(d.morningLitres()) + " LTR";
                    c1Morning = c1Morning.add(d.morningLitres());
                }
                if (d.eveningLitres() != null && d.eveningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    pmStr = formatQty(d.eveningLitres()) + " LTR";
                    c1Evening = c1Evening.add(d.eveningLitres());
                }
            }
            c1Rows.append(String.format("<tr><td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td></tr>", dateLabel, amStr, pmStr));
        }

        // Column 2: Days 11 - 20
        BigDecimal c2Morning = BigDecimal.ZERO;
        BigDecimal c2Evening = BigDecimal.ZERO;
        StringBuilder c2Rows = new StringBuilder();
        for (int day = 11; day <= 20; day++) {
            BillCalculationResult.DailyMilkDetail d = dayMap.get(day);
            String dateLabel = String.format("%d-%s-%s", day, shortMonth, yearShort);
            String amStr = "NA";
            String pmStr = "NA";
            if (d != null) {
                if (d.morningLitres() != null && d.morningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    amStr = formatQty(d.morningLitres()) + " LTR";
                    c2Morning = c2Morning.add(d.morningLitres());
                }
                if (d.eveningLitres() != null && d.eveningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    pmStr = formatQty(d.eveningLitres()) + " LTR";
                    c2Evening = c2Evening.add(d.eveningLitres());
                }
            }
            c2Rows.append(String.format("<tr><td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td></tr>", dateLabel, amStr, pmStr));
        }

        // Column 3: Days 21 - End of Month (padded up to 10 rows for clean table height alignment)
        BigDecimal c3Morning = BigDecimal.ZERO;
        BigDecimal c3Evening = BigDecimal.ZERO;
        StringBuilder c3Rows = new StringBuilder();
        for (int day = 21; day <= 30; day++) {
            if (day <= daysInMonth) {
                BillCalculationResult.DailyMilkDetail d = dayMap.get(day);
                String dateLabel = String.format("%d-%s-%s", day, shortMonth, yearShort);
                String amStr = "NA";
                String pmStr = "NA";
                if (d != null) {
                    if (d.morningLitres() != null && d.morningLitres().compareTo(BigDecimal.ZERO) > 0) {
                        amStr = formatQty(d.morningLitres()) + " LTR";
                        c3Morning = c3Morning.add(d.morningLitres());
                    }
                    if (d.eveningLitres() != null && d.eveningLitres().compareTo(BigDecimal.ZERO) > 0) {
                        pmStr = formatQty(d.eveningLitres()) + " LTR";
                        c3Evening = c3Evening.add(d.eveningLitres());
                    }
                }
                c3Rows.append(String.format("<tr><td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td></tr>", dateLabel, amStr, pmStr));
            } else {
                c3Rows.append("<tr><td class='c-date'>-</td><td class='c-val'>-</td><td class='c-val'>-</td></tr>");
            }
        }
        // If 31st exists, add 31st into c3 as an extra or sub-row if needed
        if (daysInMonth == 31) {
            BillCalculationResult.DailyMilkDetail d = dayMap.get(31);
            String dateLabel = String.format("31-%s-%s", shortMonth, yearShort);
            String amStr = "NA";
            String pmStr = "NA";
            if (d != null) {
                if (d.morningLitres() != null && d.morningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    amStr = formatQty(d.morningLitres()) + " LTR";
                    c3Morning = c3Morning.add(d.morningLitres());
                }
                if (d.eveningLitres() != null && d.eveningLitres().compareTo(BigDecimal.ZERO) > 0) {
                    pmStr = formatQty(d.eveningLitres()) + " LTR";
                    c3Evening = c3Evening.add(d.eveningLitres());
                }
            }
            c3Rows.append(String.format("<tr><td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td></tr>", dateLabel, amStr, pmStr));
        }

        String c1TotalMorningStr = c1Morning.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c1Morning) + " LTR" : "0.00 LTR";
        String c1TotalEveningStr = c1Evening.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c1Evening) + " LTR" : "0.00 LTR";

        String c2TotalMorningStr = c2Morning.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c2Morning) + " LTR" : "0.00 LTR";
        String c2TotalEveningStr = c2Evening.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c2Evening) + " LTR" : "0.00 LTR";

        String c3TotalMorningStr = c3Morning.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c3Morning) + " LTR" : "0.00 LTR";
        String c3TotalEveningStr = c3Evening.compareTo(BigDecimal.ZERO) > 0 ? formatQty(c3Evening) + " LTR" : "0.00 LTR";

        // Summary right side
        String totalMorningStr = formatQty(calc.morningLitres()) + " LTR";
        String totalEveningStr = formatQty(calc.eveningLitres()) + " LTR";
        String totalMilkStr = formatQty(calc.totalLitres()) + " LTR";
        String rateStr = formatCurr(commonRate);
        String milkAmountStr = formatCurr(calc.milkTotalAmount());
        String grandTotalStr = formatCurr(calc.grandTotal());

        // Products breakdown row (Dahi, Ghee, Shrikhand, Taak, Basundi, Paneer, Milk)
        Map<String, BigDecimal> prodQtyMap = new HashMap<>();
        Map<String, BigDecimal> prodAmtMap = new HashMap<>();
        if (calc.productDetails() != null) {
            for (BillCalculationResult.ProductPurchaseDetail p : calc.productDetails()) {
                String pName = p.productName().trim().toLowerCase();
                prodQtyMap.put(pName, prodQtyMap.getOrDefault(pName, BigDecimal.ZERO).add(p.quantity()));
                prodAmtMap.put(pName, prodAmtMap.getOrDefault(pName, BigDecimal.ZERO).add(p.totalAmount()));
            }
        }

        String[] standardProds = {"DAHI", "GHEE", "SHRIKHAND", "TAAK", "BASUNDI", "PANEER", "MILK"};
        StringBuilder prodHeaderHtml = new StringBuilder();
        StringBuilder prodQtyHtml = new StringBuilder();
        StringBuilder prodAmtHtml = new StringBuilder();

        for (String prod : standardProds) {
            String displayName = prod.equals("BASUNDI") ? "BASUNTI" : prod;
            prodHeaderHtml.append("<th>").append(displayName).append("</th>");
            if (prod.equals("MILK")) {
                prodQtyHtml.append("<td>").append(totalMilkStr).append("</td>");
                prodAmtHtml.append("<td>").append(milkAmountStr).append("</td>");
            } else {
                BigDecimal qty = BigDecimal.ZERO;
                BigDecimal amt = BigDecimal.ZERO;
                for (Map.Entry<String, BigDecimal> entry : prodQtyMap.entrySet()) {
                    if (entry.getKey().contains(prod.toLowerCase())) {
                        qty = qty.add(entry.getValue());
                    }
                }
                for (Map.Entry<String, BigDecimal> entry : prodAmtMap.entrySet()) {
                    if (entry.getKey().contains(prod.toLowerCase())) {
                        amt = amt.add(entry.getValue());
                    }
                }
                String unit = (prod.equals("TAAK") || prod.equals("BASUNDI")) ? "LTR" : "KG";
                prodQtyHtml.append("<td>").append(formatQty(qty)).append(" ").append(unit).append("</td>");
                prodAmtHtml.append("<td>").append(amt.compareTo(BigDecimal.ZERO) > 0 ? formatCurr(amt) : "0").append("</td>");
            }
        }

        String amountInWords = NumberToWordsConverter.convertToWords(calc.grandTotal());

        String bannerImgTag = cachedBannerBase64 != null
                ? "<img src='data:image/png;base64," + cachedBannerBase64 + "' style='width: 100%; max-height: 180px; object-fit: contain; border: 1px solid #1e293b;' />"
                : "<div style='font-size: 24px; font-weight: bold; text-align: center; padding: 15px; border: 2px solid #1e293b;'>विपुल मिल्क (VIPUL MILK)</div>";

        String qrImgTag = cachedQrBase64 != null
                ? "<img src='data:image/png;base64," + cachedQrBase64 + "' style='width: 135px; height: auto; border: 1px solid #cbd5e1;' />"
                : "<div style='width: 135px; height: 160px; border: 1px solid #94a3b8; text-align: center; line-height: 160px; font-size: 10px;'>QR CODE</div>";

        // Total Amount (in sample: plain integer without currency symbol, e.g. 1395)
        String totalAmountIntegerStr = calc.grandTotal() != null ? String.valueOf(calc.grandTotal().setScale(0, java.math.RoundingMode.HALF_UP)) : "0";
        String rateDisplayStr = commonRate != null ? String.valueOf(commonRate.setScale(0, java.math.RoundingMode.HALF_UP)) : "90";
        String milkAmountDisplayStr = calc.milkTotalAmount() != null ? String.valueOf(calc.milkTotalAmount().setScale(0, java.math.RoundingMode.HALF_UP)) : "0";

        // Marathi notice text with effective date e.g. 01/11/26
        String rateNoticeDate = String.format("01/%02d/%s", month, yearShort);

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\" />\n" +
                "    <title>Bill - " + customerName + "</title>\n" +
                "    <style>\n" +
                "        @page {\n" +
                "            size: A4 portrait;\n" +
                "            margin: 12mm 10mm 10mm 10mm;\n" +
                "        }\n" +
                "        body {\n" +
                "            font-family: 'Noto Sans Devanagari', Arial, Helvetica, sans-serif;\n" +
                "            font-size: 8pt;\n" +
                "            color: #111827;\n" +
                "            margin: 0;\n" +
                "            padding: 0;\n" +
                "        }\n" +
                "        .header-container {\n" +
                "            text-align: center;\n" +
                "            margin-bottom: 10px;\n" +
                "        }\n" +
                "        .customer-box {\n" +
                "            margin-bottom: 10px;\n" +
                "            font-size: 8.5pt;\n" +
                "            font-weight: bold;\n" +
                "            line-height: 1.4;\n" +
                "        }\n" +
                "        .customer-table {\n" +
                "            width: 100%;\n" +
                "            border-collapse: collapse;\n" +
                "        }\n" +
                "        .customer-table td {\n" +
                "            padding: 2px 4px;\n" +
                "        }\n" +
                "        .cust-underline {\n" +
                "            border-bottom: 1px solid #94a3b8;\n" +
                "            display: inline-block;\n" +
                "            width: 70%;\n" +
                "            padding-left: 8px;\n" +
                "        }\n" +
                "        /* Main Record Layout */\n" +
                "        .grid-container {\n" +
                "            width: 100%;\n" +
                "            margin-bottom: 10px;\n" +
                "        }\n" +
                "        .datewise-table {\n" +
                "            width: 100%;\n" +
                "            border-collapse: collapse;\n" +
                "            font-size: 7.2pt;\n" +
                "        }\n" +
                "        .datewise-table th, .datewise-table td {\n" +
                "            border: 1px solid #475569;\n" +
                "            padding: 2.2px 3px;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .header-blue-top {\n" +
                "            background-color: #dbeafe;\n" +
                "            font-weight: bold;\n" +
                "            color: #1e3a8a;\n" +
                "        }\n" +
                "        .header-blue {\n" +
                "            background-color: #eff6ff;\n" +
                "            font-weight: bold;\n" +
                "            color: #1e40af;\n" +
                "        }\n" +
                "        .c-date {\n" +
                "            font-weight: bold;\n" +
                "            width: 13.5%;\n" +
                "            background-color: #fafaf9;\n" +
                "        }\n" +
                "        .c-val {\n" +
                "            width: 9.9%;\n" +
                "        }\n" +
                "        /* Summary Side Blocks */\n" +
                "        .summary-card {\n" +
                "            border: 1px solid #94a3b8;\n" +
                "            margin-bottom: 8px;\n" +
                "            text-align: center;\n" +
                "            border-radius: 3px;\n" +
                "            background-color: #eff6ff;\n" +
                "        }\n" +
                "        .summary-title {\n" +
                "            font-weight: bold;\n" +
                "            padding: 3px;\n" +
                "            font-size: 7.5pt;\n" +
                "            color: #1e3a8a;\n" +
                "        }\n" +
                "        .summary-val {\n" +
                "            padding: 3px;\n" +
                "            font-weight: bold;\n" +
                "            font-size: 8.5pt;\n" +
                "            color: #0f172a;\n" +
                "        }\n" +
                "        /* Product Table */\n" +
                "        .prod-table {\n" +
                "            width: 100%;\n" +
                "            border-collapse: collapse;\n" +
                "            font-size: 7.5pt;\n" +
                "            margin-top: 4px;\n" +
                "            margin-bottom: 8px;\n" +
                "        }\n" +
                "        .prod-table th, .prod-table td {\n" +
                "            border: 1px solid #475569;\n" +
                "            padding: 3px;\n" +
                "            text-align: center;\n" +
                "        }\n" +
                "        .prod-table th {\n" +
                "            background-color: #dbeafe;\n" +
                "            font-weight: bold;\n" +
                "            color: #1e3a8a;\n" +
                "        }\n" +
                "        /* Notice and QR section */\n" +
                "        .notice-marathi {\n" +
                "            font-size: 8.5pt;\n" +
                "            line-height: 1.5;\n" +
                "            color: #0f172a;\n" +
                "            font-weight: 600;\n" +
                "        }\n" +
                "        .phonepe-banner {\n" +
                "            background-color: #5f259f;\n" +
                "            color: white;\n" +
                "            text-align: center;\n" +
                "            font-weight: bold;\n" +
                "            font-size: 8.5pt;\n" +
                "            padding: 3px;\n" +
                "            border-radius: 4px;\n" +
                "            margin-bottom: 4px;\n" +
                "        }\n" +
                "        .words-line {\n" +
                "            border-bottom: 1px solid #64748b;\n" +
                "            padding-bottom: 2px;\n" +
                "            padding-left: 6px;\n" +
                "            display: inline-block;\n" +
                "            width: 75%;\n" +
                "            font-weight: bold;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "\n" +
                "    <!-- 1. Header Banner -->\n" +
                "    <div class=\"header-container\">\n" +
                "        " + bannerImgTag + "\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- 2. Customer Details -->\n" +
                "    <div class=\"customer-box\">\n" +
                "        <table class=\"customer-table\">\n" +
                "            <tr>\n" +
                "                <td style=\"width: 140px;\">CUSTOMER NAME</td>\n" +
                "                <td style=\"width: 15px;\">:-</td>\n" +
                "                <td><span class=\"cust-underline\">" + customerName.toUpperCase() + "</span></td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>ADDRESS</td>\n" +
                "                <td>:-</td>\n" +
                "                <td><span class=\"cust-underline\">" + address + "</span></td>\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td>CONTACT NO.</td>\n" +
                "                <td>:-</td>\n" +
                "                <td><span class=\"cust-underline\">" + phone + "</span></td>\n" +
                "            </tr>\n" +
                "        </table>\n" +
                "    </div>\n" +
                "\n" +
                "    <!-- 3. Datewise Milk Record (3 Columns of 10 days) + Right Side Summary -->\n" +
                "    <table class=\"grid-container\" style=\"border-collapse: collapse;\">\n" +
                "        <tr style=\"vertical-align: top;\">\n" +
                "            <!-- 3 Columns Table (81% width) -->\n" +
                "            <td style=\"width: 81%; padding-right: 8px;\">\n" +
                "                <table class=\"datewise-table\">\n" +
                "                    <thead>\n" +
                "                        <tr>\n" +
                "                            <th colspan=\"9\" class=\"header-blue-top\" style=\"font-size: 8pt;\">DATEWISE MILK RECORD</th>\n" +
                "                        </tr>\n" +
                "                        <tr class=\"header-blue\">\n" +
                "                            <th style=\"width: 13.5%;\">DATE</th>\n" +
                "                            <th style=\"width: 9.9%;\">AM</th>\n" +
                "                            <th style=\"width: 9.9%;\">PM</th>\n" +
                "                            <th style=\"width: 13.5%;\">DATE</th>\n" +
                "                            <th style=\"width: 9.9%;\">AM</th>\n" +
                "                            <th style=\"width: 9.9%;\">PM</th>\n" +
                "                            <th style=\"width: 13.5%;\">DATE</th>\n" +
                "                            <th style=\"width: 9.9%;\">AM</th>\n" +
                "                            <th style=\"width: 9.9%;\">PM</th>\n" +
                "                        </tr>\n" +
                "                    </thead>\n" +
                "                    <tbody>\n" +
                "                        " + generateInterleavedRows(month, year, dayMap) + "\n" +
                "                    </tbody>\n" +
                "                    <tfoot>\n" +
                "                        <tr class=\"header-blue\">\n" +
                "                            <td>TOTAL</td>\n" +
                "                            <td>" + c1TotalMorningStr + "</td>\n" +
                "                            <td>" + c1TotalEveningStr + "</td>\n" +
                "                            <td>TOTAL</td>\n" +
                "                            <td>" + c2TotalMorningStr + "</td>\n" +
                "                            <td>" + c2TotalEveningStr + "</td>\n" +
                "                            <td>TOTAL</td>\n" +
                "                            <td>" + c3TotalMorningStr + "</td>\n" +
                "                            <td>" + c3TotalEveningStr + "</td>\n" +
                "                        </tr>\n" +
                "                    </tfoot>\n" +
                "                </table>\n" +
                "            </td>\n" +
                "\n" +
                "            <!-- Summary Side Blocks (19% width) -->\n" +
                "            <td style=\"width: 19%;\">\n" +
                "                <div class=\"summary-card\">\n" +
                "                    <div class=\"summary-title\">TOTAL MORNIG</div>\n" +
                "                    <div class=\"summary-val\">" + totalMorningStr + "</div>\n" +
                "                </div>\n" +
                "                <div class=\"summary-card\">\n" +
                "                    <div class=\"summary-title\">TOTAL EVENING</div>\n" +
                "                    <div class=\"summary-val\">" + totalEveningStr + "</div>\n" +
                "                </div>\n" +
                "                <div class=\"summary-card\">\n" +
                "                    <div class=\"summary-title\">TOTAL MILK</div>\n" +
                "                    <div class=\"summary-val\">" + totalMilkStr + "</div>\n" +
                "                </div>\n" +
                "                <div class=\"summary-card\">\n" +
                "                    <div class=\"summary-title\">RATE</div>\n" +
                "                    <div class=\"summary-val\">" + rateDisplayStr + "</div>\n" +
                "                </div>\n" +
                "                <div class=\"summary-card\">\n" +
                "                    <div class=\"summary-title\">MILK AMOUNT</div>\n" +
                "                    <div class=\"summary-val\">" + milkAmountDisplayStr + "</div>\n" +
                "                </div>\n" +
                "                <div class=\"summary-card\" style=\"margin-top: 10px; background-color: #e2e8f0;\">\n" +
                "                    <div class=\"summary-title\" style=\"font-size: 8pt;\">TOTAL AMOUNT</div>\n" +
                "                    <div class=\"summary-val\" style=\"font-size: 10pt; color: #0f172a;\">" + totalAmountIntegerStr + "</div>\n" +
                "                </div>\n" +
                "            </td>\n" +
                "        </tr>\n" +
                "    </table>\n" +
                "\n" +
                "    <!-- 4. Product Purchases Table -->\n" +
                "    <table class=\"prod-table\">\n" +
                "        <thead>\n" +
                "            <tr>\n" +
                "                <th style=\"width: 14%;\">PRODUCT</th>\n" +
                "                " + prodHeaderHtml + "\n" +
                "            </tr>\n" +
                "        </thead>\n" +
                "        <tbody>\n" +
                "            <tr>\n" +
                "                <td style=\"font-weight: bold; background-color: #fafaf9;\">QUANTITY</td>\n" +
                "                " + prodQtyHtml + "\n" +
                "            </tr>\n" +
                "            <tr>\n" +
                "                <td style=\"font-weight: bold; background-color: #fafaf9;\">AMOUNT</td>\n" +
                "                " + prodAmtHtml + "\n" +
                "            </tr>\n" +
                "        </tbody>\n" +
                "    </table>\n" +
                "\n" +
                "    <!-- 5. Notices, Instructions, QR Code and Payment Info -->\n" +
                "    <table style=\"width: 100%; border-collapse: collapse; margin-top: 10px;\">\n" +
                "        <tr style=\"vertical-align: top;\">\n" +
                "            <td style=\"width: 74%; padding-right: 12px;\">\n" +
                "                <!-- Marathi Rate Notice -->\n" +
                "                <div style=\"text-align: center; font-size: 10pt; font-weight: bold; color: #000; margin-bottom: 12px;\">\n" +
                "                    दिनांक " + rateNoticeDate + " पासून दुधाचे भाव " + rateDisplayStr + " रुपये लिटर प्रमाणे झालेले आहे\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- Marathi Online payment instruction -->\n" +
                "                <div class=\"notice-marathi\" style=\"margin-bottom: 10px;\">\n" +
                "                    कृपया आपण ऑनलाइन पेमेंट केल्यास स्क्रीन शॉट टाकावा नगदी पण पैसे आपण<br/>\n" +
                "                    दिले असल्यास या व्हाट्सअप नंबर ला कळवावे ही नम्र विनंती &#160;<span style=\"font-weight: bold; font-size: 9.5pt;\">9116438833</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- Marathi Dairy delivery contact message -->\n" +
                "                <div class=\"notice-marathi\" style=\"font-size: 8pt; margin-bottom: 18px;\">\n" +
                "                    सर्व ग्राहकांना नम्र विनंती की आम्ही आपल्यापर्यंत रोज ताजे व कोरे दूध पोचवत आहे एखाद्या वेळेस<br/>\n" +
                "                    आपल्याला दूध नाही मिळाले तर खालील नंबर वर जरूर कळवावे <span style=\"font-weight: bold;\">9116438833</span>\n" +
                "                </div>\n" +
                "\n" +
                "                <!-- Amount in Words -->\n" +
                "                <div style=\"font-weight: bold; font-size: 8pt; margin-top: 10px;\">\n" +
                "                    AMOUNT IN WORDS :- <span class=\"words-line\">" + amountInWords + "</span>\n" +
                "                </div>\n" +
                "            </td>\n" +
                "\n" +
                "            <!-- PhonePe QR Code block -->\n" +
                "            <td style=\"width: 26%; text-align: center; vertical-align: top;\">\n" +
                "                <div style=\"margin-top: 3px;\">" + qrImgTag + "</div>\n" +
                "            </td>\n" +
                "        </tr>\n" +
                "    </table>\n" +
                "\n" +
                "</body>\n" +
                "</html>";
    }

    private String generateInterleavedRows(int month, int year, Map<Integer, BillCalculationResult.DailyMilkDetail> dayMap) {
        YearMonth ym = YearMonth.of(year, month);
        int daysInMonth = ym.lengthOfMonth();
        String shortMonth = Month.of(month).getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
        String yearShort = String.valueOf(year % 100);

        StringBuilder sb = new StringBuilder();

        // 10 standard rows
        for (int i = 0; i < 10; i++) {
            int d1 = 1 + i;
            int d2 = 11 + i;
            int d3 = 21 + i;

            sb.append("<tr>");

            // Col 1 (Days 1 to 10)
            String label1 = String.format("%d-%s-%s", d1, shortMonth, yearShort);
            BillCalculationResult.DailyMilkDetail m1 = dayMap.get(d1);
            String am1 = (m1 != null && m1.morningLitres() != null && m1.morningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m1.morningLitres()) + " LTR" : "NA";
            String pm1 = (m1 != null && m1.eveningLitres() != null && m1.eveningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m1.eveningLitres()) + " LTR" : "NA";
            sb.append(String.format("<td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td>", label1, am1, pm1));

            // Col 2 (Days 11 to 20)
            String label2 = String.format("%d-%s-%s", d2, shortMonth, yearShort);
            BillCalculationResult.DailyMilkDetail m2 = dayMap.get(d2);
            String am2 = (m2 != null && m2.morningLitres() != null && m2.morningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m2.morningLitres()) + " LTR" : "NA";
            String pm2 = (m2 != null && m2.eveningLitres() != null && m2.eveningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m2.eveningLitres()) + " LTR" : "NA";
            sb.append(String.format("<td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td>", label2, am2, pm2));

            // Col 3 (Days 21 to 30)
            if (d3 <= daysInMonth) {
                String label3 = String.format("%d-%s-%s", d3, shortMonth, yearShort);
                BillCalculationResult.DailyMilkDetail m3 = dayMap.get(d3);
                String am3 = (m3 != null && m3.morningLitres() != null && m3.morningLitres().compareTo(BigDecimal.ZERO) > 0)
                        ? formatQty(m3.morningLitres()) + " LTR" : "NA";
                String pm3 = (m3 != null && m3.eveningLitres() != null && m3.eveningLitres().compareTo(BigDecimal.ZERO) > 0)
                        ? formatQty(m3.eveningLitres()) + " LTR" : "NA";
                sb.append(String.format("<td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td>", label3, am3, pm3));
            } else {
                sb.append("<td class='c-date'>-</td><td class='c-val'>-</td><td class='c-val'>-</td>");
            }

            sb.append("</tr>\n");
        }

        // If month has 31 days, add the 31st row
        if (daysInMonth == 31) {
            sb.append("<tr>");
            sb.append("<td class='c-date'>-</td><td class='c-val'>-</td><td class='c-val'>-</td>");
            sb.append("<td class='c-date'>-</td><td class='c-val'>-</td><td class='c-val'>-</td>");

            String label31 = String.format("31-%s-%s", shortMonth, yearShort);
            BillCalculationResult.DailyMilkDetail m31 = dayMap.get(31);
            String am31 = (m31 != null && m31.morningLitres() != null && m31.morningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m31.morningLitres()) + " LTR" : "NA";
            String pm31 = (m31 != null && m31.eveningLitres() != null && m31.eveningLitres().compareTo(BigDecimal.ZERO) > 0)
                    ? formatQty(m31.eveningLitres()) + " LTR" : "NA";
            sb.append(String.format("<td class='c-date'>%s</td><td class='c-val'>%s</td><td class='c-val'>%s</td>", label31, am31, pm31));
            sb.append("</tr>\n");
        }

        return sb.toString();
    }

    private String formatCurr(BigDecimal val) {
        if (val == null) return "0.00";
        return String.format(Locale.US, "%,.2f", val);
    }

    private String formatQty(BigDecimal val) {
        if (val == null) return "0.00";
        BigDecimal stripped = val.stripTrailingZeros();
        if (stripped.scale() <= 2) {
            return String.format(Locale.US, "%.2f", val);
        }
        return String.format(Locale.US, "%.3f", val);
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
