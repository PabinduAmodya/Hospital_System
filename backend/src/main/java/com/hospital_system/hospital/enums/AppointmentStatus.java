package com.hospital_system.hospital.enums;

public enum AppointmentStatus {
    PENDING,      // Initial booking
    CONFIRMED,    // Confirmed by receptionist
    COMPLETED,    // Appointment finished
    PAID,         // Payment received
    CANCELLED,    // Cancelled appointment
    REFUNDED,     // Payment refunded
    RESCHEDULED ,  // Moved to different date
    SCHEDULES,
    BOOKED
}