package com.hospital_system.hospital.dto;

public class AuthResponse {
    private String token;
    private String username;
    private String role;
    private String message;
    private String name;

    public AuthResponse() {}

    public AuthResponse(String token, String username, String role, String message, String name) {
        this.token = token;
        this.username = username;
        this.role = role;
        this.message = message;
        this.name = name;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}