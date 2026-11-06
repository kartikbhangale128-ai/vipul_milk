package com.vipulmilk.service;

import com.vipulmilk.entity.Owner;
import com.vipulmilk.repository.OwnerRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OwnerService {

    private static final Logger log = LoggerFactory.getLogger(OwnerService.class);

    private final OwnerRepository ownerRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.owner.username:vipul}")
    private String defaultUsername;

    @Value("${app.owner.default-password:vipul@dairy2026}")
    private String defaultPassword;

    @Value("${app.owner.name:Vipul Patel}")
    private String defaultFullName;

    public OwnerService(OwnerRepository ownerRepository, PasswordEncoder passwordEncoder) {
        this.ownerRepository = ownerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    @Transactional
    public void initOwnerAccount() {
        if (ownerRepository.count() == 0) {
            String hash = passwordEncoder.encode(defaultPassword);
            Owner owner = new Owner(defaultUsername, hash, defaultFullName);
            ownerRepository.save(owner);
            log.info("Initialized default Dairy Owner account: '{}'", defaultUsername);
        }
    }

    public Owner getOwner() {
        return ownerRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Owner account not configured"));
    }

    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        Owner owner = getOwner();
        if (!passwordEncoder.matches(currentPassword, owner.getPasswordHash())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        owner.setPasswordHash(passwordEncoder.encode(newPassword));
        ownerRepository.save(owner);
    }
}

