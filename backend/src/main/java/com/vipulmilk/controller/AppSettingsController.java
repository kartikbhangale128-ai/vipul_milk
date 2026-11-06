package com.vipulmilk.controller;

import com.vipulmilk.entity.AppSettings;
import com.vipulmilk.repository.AppSettingsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/settings")
public class AppSettingsController {

    private final AppSettingsRepository appSettingsRepository;

    public AppSettingsController(AppSettingsRepository appSettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
    }

    @GetMapping
    public ResponseEntity<AppSettings> getSettings() {
        AppSettings settings = appSettingsRepository.findById(1L).orElseGet(AppSettings::new);
        return ResponseEntity.ok(settings);
    }

    @PutMapping
    public ResponseEntity<AppSettings> updateSettings(@RequestBody AppSettings updated) {
        AppSettings settings = appSettingsRepository.findById(1L).orElseGet(AppSettings::new);
        settings.setBusinessName(updated.getBusinessName());
        settings.setTagline(updated.getTagline());
        settings.setOwnerName(updated.getOwnerName());
        settings.setContactPhone(updated.getContactPhone());
        settings.setAddress(updated.getAddress());
        settings.setGstOrLicense(updated.getGstOrLicense());
        settings.setBankDetails(updated.getBankDetails());
        settings.setUpiId(updated.getUpiId());

        AppSettings saved = appSettingsRepository.save(settings);
        return ResponseEntity.ok(saved);
    }
}

