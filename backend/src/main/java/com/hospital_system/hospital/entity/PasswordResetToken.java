package com.hospital_system.hospital.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String token;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    private boolean used = false;

    public PasswordResetToken() {}

    public PasswordResetToken(String token, User user, LocalDateTime expiresAt) {
        this.token = token;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    public boolean isExpired() { return LocalDateTime.now().isAfter(expiresAt); }
    public boolean isValid()   { return !used && !isExpired(); }

    public Long getId()                  { return id; }
    public String getToken()             { return token; }
    public User getUser()                { return user; }
    public LocalDateTime getExpiresAt()  { return expiresAt; }
    public boolean isUsed()              { return used; }
    public void setUsed(boolean used)    { this.used = used; }
    public void setToken(String t)       { this.token = t; }
    public void setUser(User u)          { this.user = u; }
    public void setExpiresAt(LocalDateTime e) { this.expiresAt = e; }
}