package com.hospital_system.hospital.enums;

public enum AppointmentStatus {
    PENDING,
    CONFIRMED,
    COMPLETED,
    CANCELLED,
    RESCHEDULED,
    // Legacy values — kept only so existing DB rows don't crash on load.
    // New code must NOT set these. Use PaymentStatus for payment tracking.
    PAID,
    BOOKED,
    SCHEDULES
}