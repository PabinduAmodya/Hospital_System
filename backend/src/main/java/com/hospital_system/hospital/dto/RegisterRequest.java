package com.hospital_system.hospital.dto;

import com.hospital_system.hospital.entity.Role;

public class RegisterRequest {
    private String name;
    private String username;
    private String password;
    private Role role;

    public RegisterRequest() {}

    public RegisterRequest(String name, String username, String password, Role role) {
        this.name = name;
        this.username = username;
        this.password = password;
        this.role = role;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}