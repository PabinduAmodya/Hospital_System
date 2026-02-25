package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.ScheduleDTO;
import com.hospital_system.hospital.dto.ScheduleResponse;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.service.DoctorService;
import com.hospital_system.hospital.service.ScheduleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

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
    public ScheduleResponse addSchedule(@Valid @RequestBody ScheduleDTO scheduleDTO) {
        Doctor doctor = doctorService.getById(scheduleDTO.getDoctorId());
        Schedule schedule = new Schedule(
                scheduleDTO.getDay(),
                scheduleDTO.getStartTime(),
                scheduleDTO.getEndTime(),
                doctor
        );
        return ScheduleResponse.from(scheduleService.create(schedule));
    }

    // READ all — returns ScheduleResponse so doctor name is always included
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping
    public List<ScheduleResponse> getAllSchedules() {
        return scheduleService.getAll()
                .stream()
                .map(ScheduleResponse::from)
                .collect(Collectors.toList());
    }

    // READ schedules by doctor
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/doctor/{doctorId}")
    public List<ScheduleResponse> getSchedulesByDoctor(@PathVariable Long doctorId) {
        return scheduleService.getByDoctorId(doctorId)
                .stream()
                .map(ScheduleResponse::from)
                .collect(Collectors.toList());
    }

    // READ single schedule
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    @GetMapping("/detail/{id}")
    public ScheduleResponse getScheduleById(@PathVariable Long id) {
        return ScheduleResponse.from(scheduleService.getById(id));
    }

    // UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ScheduleResponse updateSchedule(@PathVariable Long id, @Valid @RequestBody ScheduleDTO scheduleDTO) {
        Doctor doctor = doctorService.getById(scheduleDTO.getDoctorId());
        Schedule updated = new Schedule(
                scheduleDTO.getDay(),
                scheduleDTO.getStartTime(),
                scheduleDTO.getEndTime(),
                doctor
        );
        return ScheduleResponse.from(scheduleService.update(id, updated));
    }

    // DELETE
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public String deleteSchedule(@PathVariable Long id) {
        scheduleService.delete(id);
        return "Schedule deleted!";
    }
}