package com.hospital_system.hospital.dto;

public class CancelAppointmentDTO {
    private String cancellationReason;
    private boolean refundRequired;

    public CancelAppointmentDTO() {}

    public String getCancellationReason() { return cancellationReason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

    public boolean isRefundRequired() { return refundRequired; }
    public void setRefundRequired(boolean refundRequired) { this.refundRequired = refundRequired; }
}