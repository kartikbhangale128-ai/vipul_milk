package com.vipulmilk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.Properties;

@SpringBootApplication
public class VipulMilkApplication {

    public static void main(String[] args) {
        loadDotenvIfPresent();
        SpringApplication.run(VipulMilkApplication.class, args);
    }

    private static void loadDotenvIfPresent() {
        File[] candidateFiles = new File[] {
                new File(".env"),
                new File("backend/.env"),
                new File("../backend/.env")
        };

        for (File envFile : candidateFiles) {
            if (envFile.exists() && envFile.isFile()) {
                try (InputStream input = new FileInputStream(envFile)) {
                    Properties props = new Properties();
                    props.load(input);
                    props.forEach((key, value) -> {
                        String k = key.toString().trim();
                        String v = value.toString().trim();
                        if (System.getProperty(k) == null && System.getenv(k) == null) {
                            System.setProperty(k, v);
                        }
                    });
                    System.out.println("[VIPUL-MILK] Loaded environment settings from: " + envFile.getAbsolutePath());
                    break;
                } catch (Exception e) {
                    System.err.println("[VIPUL-MILK] Warning: Could not read .env file: " + e.getMessage());
                }
            }
        }
    }
}
