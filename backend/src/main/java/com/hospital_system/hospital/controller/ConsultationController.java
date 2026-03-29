package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.entity.Consultation;
import com.hospital_system.hospital.entity.PrescriptionItem;
import com.hospital_system.hospital.service.ConsultationService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
@CrossOrigin(origins = "*")
public class ConsultationController {

    @Autowired
    private ConsultationService consultationService;

    // ─── Helper ────────────────────────────────────────────────────────

    private String getCurrentUser() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    // ─── 1. Start Consultation from Appointment ───────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @PostMapping("/start/{appointmentId}")
    public ResponseEntity<?> startConsultation(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(consultationService.startConsultation(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 2. Start Walk-in Consultation ────────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @PostMapping("/walk-in")
    public ResponseEntity<?> startWalkInConsultation(@RequestBody Map<String, Long> body) {
        try {
            Long patientId = body.get("patientId");
            Long doctorId = body.get("doctorId");
            return ResponseEntity.ok(consultationService.startWalkInConsultation(patientId, doctorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 3. Get Consultation by ID ────────────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(consultationService.getById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ─── 4. Update Vitals ─────────────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/vitals")
    public ResponseEntity<?> updateVitals(@PathVariable Long id,
                                          @RequestBody Map<String, Object> vitals) {
        try {
            return ResponseEntity.ok(consultationService.updateVitals(id, vitals));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 5. Update Clinical Data ──────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/clinical")
    public ResponseEntity<?> updateClinicalData(@PathVariable Long id,
                                                @RequestBody Map<String, String> data) {
        try {
            return ResponseEntity.ok(consultationService.updateClinicalData(id, data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 6. Add Prescription Item ─────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/{id}/prescription")
    public ResponseEntity<?> addPrescriptionItem(@PathVariable Long id,
                                                 @RequestBody PrescriptionItem item) {
        try {
            return ResponseEntity.ok(consultationService.addPrescriptionItem(id, item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 7. Remove Prescription Item ──────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @DeleteMapping("/{id}/prescription/{itemId}")
    public ResponseEntity<?> removePrescriptionItem(@PathVariable Long id,
                                                    @PathVariable Long itemId) {
        try {
            consultationService.removePrescriptionItem(id, itemId);
            return ResponseEntity.ok("Prescription item removed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 8. Update Prescription Item ──────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/prescription/{itemId}")
    public ResponseEntity<?> updatePrescriptionItem(@PathVariable Long itemId,
                                                    @RequestBody PrescriptionItem updated) {
        try {
            return ResponseEntity.ok(consultationService.updatePrescriptionItem(itemId, updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 9. Update Lab Orders ─────────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/lab-orders")
    public ResponseEntity<?> updateLabOrders(@PathVariable Long id,
                                             @RequestBody Map<String, String> body) {
        try {
            String testIds = body.get("testIds");
            String notes = body.get("notes");
            return ResponseEntity.ok(consultationService.updateLabOrders(id, testIds, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 10. Update Follow-up ─────────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/follow-up")
    public ResponseEntity<?> updateFollowUp(@PathVariable Long id,
                                            @RequestBody Map<String, String> body) {
        try {
            LocalDate followUpDate = body.get("followUpDate") != null
                    ? LocalDate.parse(body.get("followUpDate"))
                    : null;
            String instructions = body.get("instructions");
            return ResponseEntity.ok(consultationService.updateFollowUp(id, followUpDate, instructions));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 11. Update Doctor Notes ──────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/notes")
    public ResponseEntity<?> updateNotes(@PathVariable Long id,
                                         @RequestBody Map<String, String> body) {
        try {
            String notes = body.get("notes");
            return ResponseEntity.ok(consultationService.updateNotes(id, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 12. Generate AI Summary ──────────────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PostMapping("/{id}/generate-summary")
    public ResponseEntity<?> generateAiSummary(@PathVariable Long id) {
        try {
            String summary = consultationService.generateAiSummary(id);
            return ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 13. Manually Save/Edit AI Summary ────────────────────────────

    @PreAuthorize("hasRole('DOCTOR')")
    @PutMapping("/{id}/summary")
    public ResponseEntity<?> updateSummary(@PathVariable Long id,
                                           @RequestBody Map<String, String> body) {
        try {
            String summary = body.get("summary");
            return ResponseEntity.ok(consultationService.updateAiSummary(id, summary));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 14. Complete Consultation ────────────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @PostMapping("/{id}/complete")
    public ResponseEntity<?> completeConsultation(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(consultationService.completeConsultation(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 15. Get Consultations by Doctor ──────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getByDoctor(@PathVariable Long doctorId) {
        try {
            return ResponseEntity.ok(consultationService.getByDoctor(doctorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 16. Get Consultations by Patient ─────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN','RECEPTIONIST')")
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getByPatient(@PathVariable Long patientId) {
        try {
            return ResponseEntity.ok(consultationService.getByPatient(patientId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 17. Get Consultation by Appointment ──────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(consultationService.getByAppointment(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 18. Get Today's Consultations by Doctor ──────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/doctor/{doctorId}/today")
    public ResponseEntity<?> getTodayByDoctor(@PathVariable Long doctorId) {
        try {
            return ResponseEntity.ok(consultationService.getTodayByDoctor(doctorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 19. Get Recent Consultations by Doctor ───────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/doctor/{doctorId}/recent")
    public ResponseEntity<?> getRecentByDoctor(@PathVariable Long doctorId,
                                               @RequestParam(defaultValue = "10") int limit) {
        try {
            return ResponseEntity.ok(consultationService.getRecentByDoctor(doctorId, limit));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── 20. Get Doctor Stats ─────────────────────────────────────────

    @PreAuthorize("hasAnyRole('DOCTOR','ADMIN')")
    @GetMapping("/doctor/{doctorId}/stats")
    public ResponseEntity<?> getDoctorStats(@PathVariable Long doctorId) {
        try {
            return ResponseEntity.ok(consultationService.getDoctorStats(doctorId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
