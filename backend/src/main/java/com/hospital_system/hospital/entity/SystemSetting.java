package com.hospital_system.hospital.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String settingKey;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String settingValue;

    private String description;

    public SystemSetting() {}

    public SystemSetting(String settingKey, String settingValue, String description) {
        this.settingKey   = settingKey;
        this.settingValue = settingValue;
        this.description  = description;
    }

    public Long getId()                    { return id; }
    public String getSettingKey()          { return settingKey; }
    public String getSettingValue()        { return settingValue; }
    public String getDescription()         { return description; }

    public void setId(Long id)                       { this.id = id; }
    public void setSettingKey(String settingKey)     { this.settingKey = settingKey; }
    public void setSettingValue(String settingValue) { this.settingValue = settingValue; }
    public void setDescription(String description)   { this.description = description; }
}