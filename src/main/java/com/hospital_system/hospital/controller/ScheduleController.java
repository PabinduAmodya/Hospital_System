package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.ScheduleDTO;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.service.DoctorService;
import com.hospital_system.hospital.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private DoctorService doctorService;

    // CREATE
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @PostMapping("/add")
    public Schedule addSchedule(@Valid @RequestBody ScheduleDTO scheduleDTO) {
        Doctor doctor = doctorService.getById(scheduleDTO.getDoctorId());
        Schedule schedule = new Schedule(
                scheduleDTO.getDay(),
                scheduleDTO.getStartTime(),
                scheduleDTO.getEndTime(),
                doctor
        );
        return scheduleService.create(schedule);
    }

    // READ all schedules (new)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<Schedule> getAllSchedules() {
        return scheduleService.getAll();
    }

    // READ schedules by doctor (kept for backward compatibility)
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/{doctorId}")
    public List<Schedule> getSchedulesByDoctor(@PathVariable Long doctorId) {
        return scheduleService.getByDoctorId(doctorId);
    }

    // READ schedule by id (new, avoids clash with /{doctorId})
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/detail/{id}")
    public Schedule getScheduleById(@PathVariable Long id) {
        return scheduleService.getById(id);
    }

    // UPDATE (new)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Schedule updateSchedule(@PathVariable Long id, @Valid @RequestBody ScheduleDTO scheduleDTO) {
        Doctor doctor = doctorService.getById(scheduleDTO.getDoctorId());
        Schedule updated = new Schedule(
                scheduleDTO.getDay(),
                scheduleDTO.getStartTime(),
                scheduleDTO.getEndTime(),
                doctor
        );
        return scheduleService.update(id, updated);
    }

    // DELETE
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deleteSchedule(@PathVariable Long id) {
        scheduleService.delete(id);
        return "Schedule deleted!";
    }
}
