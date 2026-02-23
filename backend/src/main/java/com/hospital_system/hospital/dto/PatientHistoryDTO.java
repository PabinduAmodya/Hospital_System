package com.hospital_system.hospital.dto;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.entity.Payment;

import java.util.List;

public class PatientHistoryDTO {

    private Patient patient;
    private List<Appointment> appointments;
    private List<Bill> bills;
    private List<Payment> payments;

    public PatientHistoryDTO(Patient patient, List<Appointment> appointments, List<Bill> bills, List<Payment> payments) {
        this.patient = patient;
        this.appointments = appointments;
        this.bills = bills;
        this.payments = payments;
    }

    public Patient getPatient() { return patient; }
    public List<Appointment> getAppointments() { return appointments; }
    public List<Bill> getBills() { return bills; }
    public List<Payment> getPayments() { return payments; }
}
