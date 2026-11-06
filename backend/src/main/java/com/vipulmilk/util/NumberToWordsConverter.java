package com.vipulmilk.util;

import java.math.BigDecimal;

public class NumberToWordsConverter {

    private static final String[] units = {
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static final String[] tens = {
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static String convertToWords(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return "Rupees Zero Only";
        }

        long rupees = amount.longValue();
        int paise = amount.remainder(BigDecimal.ONE).multiply(new BigDecimal(100)).intValue();

        StringBuilder result = new StringBuilder("Rupees ");
        result.append(convertIndianNumber(rupees));

        if (paise > 0) {
            result.append(" and ").append(convertLessThanOneThousand(paise)).append(" Paise");
        }

        result.append(" Only");
        return result.toString();
    }

    private static String convertIndianNumber(long n) {
        if (n == 0) return "Zero";

        StringBuilder sb = new StringBuilder();

        // Crores (10,000,000)
        long crore = n / 10000000;
        n %= 10000000;
        if (crore > 0) {
            sb.append(convertLessThanOneThousand((int) crore)).append(" Crore ");
        }

        // Lakhs (100,000)
        long lakh = n / 100000;
        n %= 100000;
        if (lakh > 0) {
            sb.append(convertLessThanOneThousand((int) lakh)).append(" Lakh ");
        }

        // Thousands (1,000)
        long thousand = n / 1000;
        n %= 1000;
        if (thousand > 0) {
            sb.append(convertLessThanOneThousand((int) thousand)).append(" Thousand ");
        }

        // Hundreds and remaining (< 1,000)
        if (n > 0) {
            sb.append(convertLessThanOneThousand((int) n));
        }

        return sb.toString().trim();
    }

    private static String convertLessThanOneThousand(int number) {
        String current;

        if (number % 100 < 20) {
            current = units[number % 100];
            number /= 100;
        } else {
            current = units[number % 10];
            number /= 10;
            current = tens[number % 10] + (current.isEmpty() ? "" : " " + current);
            number /= 10;
        }

        if (number == 0) return current;
        return units[number] + " Hundred" + (current.isEmpty() ? "" : " " + current);
    }
}

