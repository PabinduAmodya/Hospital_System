package com.hospital_system.hospital.service;

import com.hospital_system.hospital.entity.Appointment;
import com.hospital_system.hospital.entity.Patient;
import com.hospital_system.hospital.entity.Schedule;
import com.hospital_system.hospital.repository.AppointmentRepository;
import com.hospital_system.hospital.repository.PatientRepository;
import com.hospital_system.hospital.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private ScheduleRepository scheduleRepository;


    public Appointment bookAppointment(Long patientId, Long scheduleId, java.time.LocalDate appointmentDate) throws Exception {
        Optional<Patient> patientOpt = patientRepository.findById(patientId);
        Optional<Schedule> scheduleOpt = scheduleRepository.findById(scheduleId);

        if(patientOpt.isEmpty()) throw new Exception("Patient not found");
        if(scheduleOpt.isEmpty()) throw new Exception("Schedule not found");

        Appointment appointment = new Appointment(patientOpt.get(), scheduleOpt.get(), appointmentDate, "Booked");
        return appointmentRepository.save(appointment);
    }
}
