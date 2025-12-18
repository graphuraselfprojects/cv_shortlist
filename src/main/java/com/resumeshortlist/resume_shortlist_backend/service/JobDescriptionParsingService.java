package com.resumeshortlist.resume_shortlist_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class JobDescriptionParsingService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final Tika tika = new Tika();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    public JobPosting parseJobDescription(File file) {
        JobPosting extractedData = new JobPosting();
        try {
            // 1. Extract Text
            String text = tika.parseToString(file);

            // 2. Call Gemini
            String jsonResponse = callGeminiApi(text);

            // 3. Map to Entity
            JsonNode root = objectMapper.readTree(jsonResponse);

            extractedData.setTitle(getText(root, "title"));
            extractedData.setDepartment(getText(root, "department"));
            extractedData.setDescription(getText(root, "description")); // Summary or full text
            extractedData.setMinExperienceYears(getInt(root, "minExperienceYears"));
            extractedData.setEducationLevel(getText(root, "educationLevel"));

        } catch (Exception e) {
            System.err.println("JD Parsing Failed: " + e.getMessage());
            // Fallback defaults if AI fails
            extractedData.setTitle(file.getName());
            extractedData.setDescription("Uploaded via file. Parsing failed.");
        }
        return extractedData;
    }

    private String callGeminiApi(String text) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

        String prompt = "Extract structured data from this Job Description into STRICT JSON.\n" +
                "Keys: title, department, description (summarized, max 500 chars), minExperienceYears (integer), educationLevel.\n" +
                "JSON Structure:\n" +
                "{ \"title\": \"\", \"department\": \"\", \"description\": \"\", \"minExperienceYears\": 0, \"educationLevel\": \"\" }\n" +
                "JOB DESCRIPTION TEXT:\n" + text;

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        
        Map<String, Object> generationConfig = Map.of(
            "response_mime_type", "application/json",
            "temperature", 0.0
        );

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", List.of(content));
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            JsonNode root = objectMapper.readTree(response.getBody());
            String rawJson = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            return rawJson.replaceAll("(?i)^\\s*```json\\s*", "")
                          .replaceAll("\\s*```\\s*$", "")
                          .trim();
        } catch (Exception e) {
            throw new RuntimeException("Gemini API Error: " + e.getMessage());
        }
    }

    private String getText(JsonNode node, String key) { return node.has(key) && !node.get(key).isNull() ? node.get(key).asText() : null; }
    private Integer getInt(JsonNode node, String key) { return node.has(key) && !node.get(key).isNull() ? node.get(key).asInt() : null; }
}