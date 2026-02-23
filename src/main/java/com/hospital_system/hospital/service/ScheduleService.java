package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.exception.ResourceNotFoundException;
import com.hospital_system.hospital.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScheduleService {

    @Autowired
    private ScheduleRepository scheduleRepository;

    public Schedule create(Schedule schedule) {
        return scheduleRepository.save(schedule);
    }

    public List<Schedule> getAll() {
        return scheduleRepository.findAll();
    }

    public Schedule getById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));
    }

    public List<Schedule> getByDoctorId(Long doctorId) {
        return scheduleRepository.findByDoctorId(doctorId);
    }

    public Schedule update(Long id, Schedule updated) {
        Schedule existing = getById(id);
        existing.setDay(updated.getDay());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setDoctor(updated.getDoctor());
        return scheduleRepository.save(existing);
    }

    public void delete(Long id) {
        if (!scheduleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Schedule not found: " + id);
        }
        scheduleRepository.deleteById(id);
    }

    // Backward compatible
    public Schedule saveSchedule(Schedule schedule) { return create(schedule); }
    public List<Schedule> getSchedulesByDoctorId(Long doctorId) { return getByDoctorId(doctorId); }
    public void deleteSchedule(Long id) { delete(id); }
}
