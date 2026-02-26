package com.hospital_system.hospital.dto;

public class AdminLoginDTO {
    private String username;
    private String password;

    // Default constructor
    public AdminLoginDTO() {}

    public AdminLoginDTO(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Getters & setters
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
