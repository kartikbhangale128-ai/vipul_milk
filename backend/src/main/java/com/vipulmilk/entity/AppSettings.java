package com.vipulmilk.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "app_settings")
public class AppSettings {

    @Id
    private Long id = 1L;

    @Column(name = "business_name", nullable = false, length = 150)
    private String businessName = "VIPUL MILK";

    @Column(length = 255)
    private String tagline = "Fresh & Pure Farm Milk Dairy";

    @Column(name = "owner_name", length = 150)
    private String ownerName = "Vipul Patel";

    @Column(name = "contact_phone", length = 50)
    private String contactPhone = "+91 9876543210";

    @Column(columnDefinition = "TEXT")
    private String address = "Main Dairy Center, Anand, Gujarat";

    @Column(name = "gst_or_license", length = 100)
    private String gstOrLicense;

    @Column(name = "bank_details", columnDefinition = "TEXT")
    private String bankDetails;

    @Column(name = "upi_id", length = 100)
    private String upiId = "vipulmilk@upi";

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }

    public AppSettings() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBusinessName() { return businessName; }
    public void setBusinessName(String businessName) { this.businessName = businessName; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getGstOrLicense() { return gstOrLicense; }
    public void setGstOrLicense(String gstOrLicense) { this.gstOrLicense = gstOrLicense; }

    public String getBankDetails() { return bankDetails; }
    public void setBankDetails(String bankDetails) { this.bankDetails = bankDetails; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

