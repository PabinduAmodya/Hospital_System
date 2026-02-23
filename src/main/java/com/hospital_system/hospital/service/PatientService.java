package com.hospital_system.hospital.service;

import com.hospital_system.hospital.dto.PatientHistoryDTO;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Bill;
import com.hospital_system.hospital.entity.Payment;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.PatientRepository;
import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.BillRepository;
import com.hospital_system.hospital.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private BillRepository billRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public Patient create(Patient patient) {
        return patientRepository.save(patient);
    }

    public List<Patient> getAll() {
        return patientRepository.findAll();
    }

    public Patient getById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
    }

    public Patient update(Long id, Patient updated) {
        Patient existing = getById(id);
        existing.setName(updated.getName());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setGender(updated.getGender());
        existing.setDob(updated.getDob());
        return patientRepository.save(existing);
    }

    public void delete(Long id) {
        if (!patientRepository.existsById(id)) {
            throw new ResourceNotFoundException("Patient not found: " + id);
        }
        patientRepository.deleteById(id);
    }


    public PatientHistoryDTO getHistory(Long patientId) {
        Patient patient = getById(patientId);

        List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
        List<Bill> bills = billRepository.findByPatientId(patientId);
        List<Payment> payments = paymentRepository.findByPatientId(patientId);

        return new PatientHistoryDTO(patient, appointments, bills, payments);
    }

    // Backward compatible
    public Patient addPatient(Patient patient) { return create(patient); }
    public List<Patient> getAllPatients() { return getAll(); }
    public Optional<Patient> getPatientById(Long id) { return patientRepository.findById(id); }
}
