package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Doctor create(Doctor doctor) {
        Doctor saved = doctorRepository.save(doctor);
        try { auditLogService.log("CREATE", "DOCTOR", saved.getId(), "Created doctor: " + saved.getName()); } catch (Exception e) { /* audit log should never break main flow */ }
        return saved;
    }

    public List<Doctor> getAll() {
        return doctorRepository.findAll();
    }

    public Doctor getById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found: " + id));
    }

    public Doctor update(Long id, Doctor updated) {
        Doctor existing = getById(id);
        existing.setName(updated.getName());
        existing.setSpecialization(updated.getSpecialization());
        existing.setPhone(updated.getPhone());
        existing.setEmail(updated.getEmail());
        existing.setChannelling_fee(updated.getChannelling_fee());
        Doctor saved = doctorRepository.save(existing);
        try { auditLogService.log("UPDATE", "DOCTOR", saved.getId(), "Updated doctor: " + saved.getName()); } catch (Exception e) { /* audit log should never break main flow */ }
        return saved;
    }

    public void delete(Long id) {
        if (!doctorRepository.existsById(id)) {
            throw new ResourceNotFoundException("Doctor not found: " + id);
        }
        doctorRepository.deleteById(id);
        try { auditLogService.log("DELETE", "DOCTOR", id, "Deleted doctor with ID: " + id); } catch (Exception e) { /* audit log should never break main flow */ }
    }

    // Backward compatible methods used by older controllers
    public Doctor saveDoctor(Doctor doctor) { return create(doctor); }
    public List<Doctor> getAllDoctors() { return getAll(); }
    public Doctor findById(Long id) {
        return doctorRepository.findById(id).orElse(null);
    }
}
