package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.SystemSetting;
import com.hospital_system.hospital.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SystemSettingService {

    public static final String KEY_HOSPITAL_CHARGE    = "hospital_charge";
    public static final String KEY_SPECIALIZATIONS    = "specializations";

    @Autowired
    private SystemSettingRepository repo;

    // ── Generic get/set ─────────────────────────────────────────────────

    public String getValue(String key, String defaultValue) {
        return repo.findBySettingKey(key)
                .map(SystemSetting::getSettingValue)
                .orElse(defaultValue);
    }

    public SystemSetting setValue(String key, String value, String description) {
        SystemSetting setting = repo.findBySettingKey(key)
                .orElse(new SystemSetting(key, value, description));
        setting.setSettingValue(value);
        if (description != null) setting.setDescription(description);
        return repo.save(setting);
    }

    public List<SystemSetting> getAll() {
        return repo.findAll();
    }

    // ── Hospital charge ────────────────────────────────────────────────

    public BigDecimal getHospitalCharge() {
        String val = getValue(KEY_HOSPITAL_CHARGE, "750.00");
        try { return new BigDecimal(val); }
        catch (Exception e) { return new BigDecimal("750.00"); }
    }

    public SystemSetting setHospitalCharge(BigDecimal amount) {
        return setValue(KEY_HOSPITAL_CHARGE, amount.toPlainString(), "Hospital charge added to every appointment bill");
    }

    // ── Specializations ───────────────────────────────────────────────

    public List<String> getSpecializations() {
        String raw = getValue(KEY_SPECIALIZATIONS,
                "Cardiology,Dermatology,ENT,General Practice,Gynaecology," +
                        "Neurology,Ophthalmology,Orthopaedics,Paediatrics,Psychiatry,Radiology,Urology");
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .sorted()
                .collect(Collectors.toList());
    }

    public SystemSetting setSpecializations(List<String> specializations) {
        String joined = specializations.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.joining(","));
        return setValue(KEY_SPECIALIZATIONS, joined, "Comma-separated list of doctor specializations");
    }

    // ── Billing Settings ──

    public BigDecimal getTaxRate() {
        String val = getValue("tax_rate", "0");
        return new BigDecimal(val);
    }

    public void setTaxRate(BigDecimal rate) {
        setValue("tax_rate", rate.toPlainString(), "Tax percentage applied to bills");
    }

    public String getHospitalName() {
        return getValue("hospital_name", "Delta Hospital");
    }

    public void setHospitalName(String name) {
        setValue("hospital_name", name, "Hospital display name for receipts");
    }

    public String getHospitalAddress() {
        return getValue("hospital_address", "123 Medical Avenue, Colombo 07, Sri Lanka");
    }

    public void setHospitalAddress(String address) {
        setValue("hospital_address", address, "Hospital address for receipts");
    }

    public String getHospitalPhone() {
        return getValue("hospital_phone", "+94 11 234 5678");
    }

    public void setHospitalPhone(String phone) {
        setValue("hospital_phone", phone, "Hospital phone for receipts");
    }

    public String getHospitalEmail() {
        return getValue("hospital_email", "info@deltahospital.lk");
    }

    public void setHospitalEmail(String email) {
        setValue("hospital_email", email, "Hospital email for receipts");
    }

    public List<String> getDiscountReasons() {
        String val = getValue("discount_reasons", "Senior Citizen,Staff Discount,Insurance,Loyalty,Custom");
        return Arrays.stream(val.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .sorted()
                .collect(Collectors.toList());
    }

    public void setDiscountReasons(List<String> reasons) {
        setValue("discount_reasons", String.join(",", reasons), "Available discount reasons for billing");
    }

    public List<String> getPaymentMethods() {
        String val = getValue("payment_methods", "CASH,CARD,ONLINE,BANK_TRANSFER,CHEQUE,INSURANCE");
        return Arrays.stream(val.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public void setPaymentMethods(List<String> methods) {
        setValue("payment_methods", String.join(",", methods), "Available payment methods");
    }
}



//