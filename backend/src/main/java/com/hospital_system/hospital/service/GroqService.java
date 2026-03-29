package com.hospital_system.hospital.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.*;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fasterxml.jackson.databind.node.ArrayNode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;

@Service
public class GroqService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.api.url}")
    private String apiUrl;

    @Value("${groq.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Generate a professional clinical visit summary from consultation data.
     */
    public String generateVisitSummary(
            String patientName, String patientGender, LocalDate patientDob,
            String doctorName, String doctorSpecialization,
            // Vitals
            Integer bpSystolic, Integer bpDiastolic, BigDecimal temperature,
            Integer pulseRate, Integer spO2, BigDecimal weight, BigDecimal height, BigDecimal bmi,
            Integer respiratoryRate,
            // Clinical
            String chiefComplaint, String historyOfPresentIllness,
            String pastMedicalHistory, String allergies,
            String physicalExamination, String diagnosis,
            // Prescription
            List<String> medications,
            // Labs
            List<String> labOrders,
            // Follow-up
            LocalDate followUpDate, String specialInstructions
    ) {
        try {
            // Calculate age
            String age = "Unknown";
            if (patientDob != null) {
                Period period = Period.between(patientDob, LocalDate.now());
                age = period.getYears() + " years";
            }

            // Build vitals string
            StringBuilder vitals = new StringBuilder();
            if (bpSystolic != null && bpDiastolic != null) vitals.append("BP: ").append(bpSystolic).append("/").append(bpDiastolic).append(" mmHg, ");
            if (temperature != null) vitals.append("Temperature: ").append(temperature).append("°C, ");
            if (pulseRate != null) vitals.append("Pulse: ").append(pulseRate).append(" bpm, ");
            if (spO2 != null) vitals.append("SpO2: ").append(spO2).append("%, ");
            if (respiratoryRate != null) vitals.append("RR: ").append(respiratoryRate).append("/min, ");
            if (weight != null) vitals.append("Weight: ").append(weight).append(" kg, ");
            if (height != null) vitals.append("Height: ").append(height).append(" cm, ");
            if (bmi != null) vitals.append("BMI: ").append(bmi);

            String vitalsStr = vitals.length() > 0 ? vitals.toString().replaceAll(", $", "") : "Not recorded";

            // Build medications string
            String medsStr = (medications != null && !medications.isEmpty())
                ? String.join("\n", medications)
                : "None prescribed";

            // Build labs string
            String labsStr = (labOrders != null && !labOrders.isEmpty())
                ? String.join(", ", labOrders)
                : "None ordered";

            // Build the prompt
            String prompt = String.format("""
                You are a medical documentation assistant at a hospital. Generate a professional, concise clinical visit summary from the following consultation details. The summary should be suitable for inclusion in the patient's medical record.

                Format the summary with clear sections using markdown headers. Be professional, accurate, and concise. Do not add information that wasn't provided. If a section has no data, briefly note it as "Not assessed" or "Not reported".

                ---

                **Patient Information:**
                - Name: %s
                - Age: %s
                - Gender: %s

                **Consulting Physician:**
                - Dr. %s (%s)
                - Date: %s

                **Vitals:**
                %s

                **Chief Complaint:**
                %s

                **History of Present Illness:**
                %s

                **Past Medical History:**
                %s

                **Known Allergies:**
                %s

                **Physical Examination:**
                %s

                **Diagnosis:**
                %s

                **Medications Prescribed:**
                %s

                **Investigations Ordered:**
                %s

                **Follow-up:**
                %s

                **Special Instructions:**
                %s

                ---

                Generate a well-structured clinical visit summary with sections: Visit Overview, Clinical Assessment, Treatment Plan, and Follow-up Plan. Keep it professional and concise (about 200-300 words).
                """,
                patientName != null ? patientName : "Unknown",
                age,
                patientGender != null ? patientGender : "Not specified",
                doctorName != null ? doctorName : "Unknown",
                doctorSpecialization != null ? doctorSpecialization : "General",
                LocalDate.now().toString(),
                vitalsStr,
                chiefComplaint != null ? chiefComplaint : "Not recorded",
                historyOfPresentIllness != null ? historyOfPresentIllness : "Not recorded",
                pastMedicalHistory != null ? pastMedicalHistory : "None reported",
                allergies != null ? allergies : "NKDA (No Known Drug Allergies)",
                physicalExamination != null ? physicalExamination : "Not recorded",
                diagnosis != null ? diagnosis : "Pending",
                medsStr,
                labsStr,
                followUpDate != null ? followUpDate.toString() : "As needed",
                specialInstructions != null ? specialInstructions : "None"
            );

            // Call Groq API
            return callGroqApi(prompt);

        } catch (Exception e) {
            return "Error generating AI summary: " + e.getMessage() + "\n\nPlease write the summary manually or try again.";
        }
    }

    /**
     * Call the Groq API with a prompt and return the response text.
     */
    private String callGroqApi(String prompt) throws Exception {
        // Build request body
        ObjectNode requestBody = objectMapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.put("temperature", 0.3);
        requestBody.put("max_tokens", 1500);

        ArrayNode messages = requestBody.putArray("messages");

        ObjectNode systemMessage = objectMapper.createObjectNode();
        systemMessage.put("role", "system");
        systemMessage.put("content", "You are a professional medical documentation assistant. Generate clear, accurate, and concise clinical documentation. Use proper medical terminology but ensure readability. Format output with markdown.");
        messages.add(systemMessage);

        ObjectNode userMessage = objectMapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", prompt);
        messages.add(userMessage);

        // Set headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);

        // Make the API call
        ResponseEntity<String> response = restTemplate.exchange(apiUrl, HttpMethod.POST, entity, String.class);

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode responseJson = objectMapper.readTree(response.getBody());
            JsonNode choices = responseJson.get("choices");
            if (choices != null && choices.isArray() && choices.size() > 0) {
                return choices.get(0).get("message").get("content").asText();
            }
        }

        throw new RuntimeException("Failed to get response from Groq API. Status: " + response.getStatusCode());
    }

    /**
     * Simple health check for the Groq API.
     */
    public boolean isAvailable() {
        try {
            callGroqApi("Reply with just the word 'OK'.");
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
