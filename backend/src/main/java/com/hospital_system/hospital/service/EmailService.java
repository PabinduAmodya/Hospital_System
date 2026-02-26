package com.hospital_system.hospital.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ── Password reset email ──────────────────────────────────────────
    public void sendPasswordResetEmail(String toEmail, String userName, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject   = "🏥 Hospital HMS — Password Reset Request";
        String body = buildHtml(
                "Password Reset Request",
                "Hi <strong>" + userName + "</strong>,",
                "We received a request to reset your password for your Hospital HMS account.<br>" +
                        "Click the button below to set a new password. This link expires in <strong>1 hour</strong>.",
                resetLink,
                "Reset My Password",
                "If you did not request a password reset, you can safely ignore this email."
        );
        send(toEmail, subject, body);
    }

    // ── Welcome email sent when admin creates a new user ─────────────
    public void sendWelcomeEmail(String toEmail, String userName, String role, String tempPassword, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject   = "🏥 Welcome to Hospital HMS";
        String body = buildHtml(
                "Welcome to Hospital HMS",
                "Hi <strong>" + userName + "</strong>, welcome to the Hospital Management System!",
                "Your account has been created with role <strong>" + role + "</strong>.<br><br>" +
                        "Your temporary login details:<br>" +
                        "<ul style='margin:8px 0;padding-left:20px;'>" +
                        "<li>Username: <strong>" + toEmail.split("@")[0] + "</strong></li>" +
                        "<li>Temporary password: <strong>" + tempPassword + "</strong></li>" +
                        "</ul>" +
                        "Please set a new password by clicking the button below:",
                resetLink,
                "Set My Password",
                "This password reset link expires in 24 hours. Contact your admin if you need help."
        );
        send(toEmail, subject, body);
    }

    // ── Internal send ─────────────────────────────────────────────────
    private void send(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (Exception e) {
            // Log but don't crash — email failure should not break the main flow
            System.err.println("[EmailService] Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ── HTML template ─────────────────────────────────────────────────
    private String buildHtml(String title, String greeting, String body,
                             String btnLink, String btnText, String footer) {
        return "<!DOCTYPE html><html><head><meta charset='utf-8'></head><body style='" +
                "font-family:Segoe UI,Arial,sans-serif;background:#f3f4f6;margin:0;padding:32px;'>" +
                "<div style='max-width:520px;margin:0 auto;background:#fff;border-radius:12px;" +
                "box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden;'>" +
                "<div style='background:#1d4ed8;padding:28px 32px;'>" +
                "<h1 style='color:#fff;margin:0;font-size:20px;'>🏥 Hospital HMS</h1>" +
                "<p style='color:#bfdbfe;margin:4px 0 0;font-size:13px;'>" + title + "</p></div>" +
                "<div style='padding:32px;'>" +
                "<p style='margin:0 0 16px;font-size:15px;color:#111827;'>" + greeting + "</p>" +
                "<p style='margin:0 0 28px;font-size:14px;color:#374151;line-height:1.6;'>" + body + "</p>" +
                "<a href='" + btnLink + "' style='display:inline-block;background:#1d4ed8;color:#fff;" +
                "text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;'>" +
                btnText + "</a></div>" +
                "<div style='padding:20px 32px;border-top:1px solid #e5e7eb;'>" +
                "<p style='margin:0;font-size:12px;color:#9ca3af;'>" + footer + "</p></div>" +
                "</div></body></html>";
    }
}