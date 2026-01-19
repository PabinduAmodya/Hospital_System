package com.hospital_system.hospital.controller;

import com.hospital_system.hospital.dto.ScheduleDTO;
import com.hospital_system.hospital.entity.Doctor;
import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.service.DoctorService;
import com.hospital_system.hospital.service.ScheduleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    @Autowired
    private ScheduleService scheduleService;

    @Autowired
    private DoctorService doctorService;

    // Add schedule
    @PostMapping("/add")
    public Schedule addSchedule(@RequestBody ScheduleDTO scheduleDTO) {
        Doctor doctor = doctorService.findById(scheduleDTO.getDoctorId());
        if (doctor == null) {
            throw new RuntimeException("Doctor not found!");
        }
        Schedule schedule = new Schedule(
                scheduleDTO.getDay(),
                scheduleDTO.getStartTime(),
                scheduleDTO.getEndTime(),
                doctor
        );
        return scheduleService.saveSchedule(schedule);
    }

    // Get schedules by doctor
    @GetMapping("/{doctorId}")
    public List<Schedule> getSchedulesByDoctor(@PathVariable Long doctorId) {
        return scheduleService.getSchedulesByDoctorId(doctorId);
    }

    // Delete schedule
    @DeleteMapping("/{id}")
    public String deleteSchedule(@PathVariable Long id) {
        scheduleService.deleteSchedule(id);
        return "Schedule deleted!";
    }
}
