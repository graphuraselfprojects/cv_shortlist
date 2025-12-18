package com.resumeshortlist.resume_shortlist_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.resumeshortlist.resume_shortlist_backend.entity.*;
import com.resumeshortlist.resume_shortlist_backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.io.File;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class ResumeParsingService {

    @Autowired private ResumeRepository resumeRepository;
    @Autowired private CandidateRepository candidateRepository;
    @Autowired private EducationRepository educationRepository;
    @Autowired private WorkExperienceRepository workExperienceRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private CertificationRepository certificationRepository;
    @Autowired private ExtractedSkillRepository extractedSkillRepository;

    @Autowired
    private Client geminiClient;

    private final Tika tika = new Tika();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String parseAndSaveResume(Long resumeId) throws Exception {
        // 1. Fetch Resume Record
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new RuntimeException("Resume not found"));

        Optional<Candidate> existingCandidate = candidateRepository.findByResume(resume);
        if (existingCandidate.isPresent()) {
            return "Skipped: Already Analyzed";
        }
        
        // 2. Extract Text from File
        File file = new File(resume.getFilePath());
        if (!file.exists()) throw new RuntimeException("File not found on server: " + resume.getFilePath());
        
        String resumeText = tika.parseToString(file);
        
        // 3. Call Gemini to Structure Data
        String jsonResponse = callGeminiApi(resumeText);
        
        // 4. Parse JSON Response
        JsonNode rootNode = objectMapper.readTree(jsonResponse);
        
        // 5. Save Candidate
        Candidate candidate = new Candidate();
        candidate.setResume(resume);
        candidate.setName(getText(rootNode, "name"));
        candidate.setEmail(getText(rootNode, "email"));
        candidate.setPhone(getText(rootNode, "phone"));
        candidate.setLinkedinUrl(getText(rootNode, "linkedinUrl"));
        candidate.setGithubUrl(getText(rootNode, "githubUrl"));
        candidate.setPortfolioUrl(getText(rootNode, "portfolioUrl"));
        candidate.setExtractedAt(LocalDateTime.now());
        
        candidate = candidateRepository.save(candidate);

        // 6. Save Education
        if (rootNode.has("education")) {
            for (JsonNode node : rootNode.get("education")) {
                Education edu = new Education();
                edu.setCandidate(candidate);
                edu.setDegree(getText(node, "degree"));
                edu.setInstitution(getText(node, "institution"));
                edu.setFieldOfStudy(getText(node, "fieldOfStudy"));
                edu.setStartYear(getInt(node, "startYear"));
                edu.setEndYear(getInt(node, "endYear"));
                edu.setGpa(getFloat(node, "gpa"));
                educationRepository.save(edu);
            }
        }

        // 7. Save Work Experience
        if (rootNode.has("workExperience")) {
            for (JsonNode node : rootNode.get("workExperience")) {
                WorkExperience work = new WorkExperience();
                work.setCandidate(candidate);
                work.setJobTitle(getText(node, "jobTitle"));
                work.setCompany(getText(node, "company"));
                work.setDescription(getText(node, "description"));
                work.setStartDate(getDate(node, "startDate"));
                work.setEndDate(getDate(node, "endDate"));
                work.setIsCurrent(getBool(node, "isCurrent"));
                workExperienceRepository.save(work);
            }
        }

        // 8. Save Projects
        if (rootNode.has("projects")) {
            for (JsonNode node : rootNode.get("projects")) {
                Project proj = new Project();
                proj.setCandidate(candidate);
                proj.setTitle(getText(node, "title"));
                proj.setDescription(getText(node, "description"));
                proj.setTechStack(getText(node, "techStack"));
                proj.setGithubLink(getText(node, "githubLink"));
                proj.setLiveLink(getText(node, "liveLink"));
                projectRepository.save(proj);
            }
        }

        // 9. Save Certifications (if provided by Gemini)
        if (rootNode.has("certifications")) {
            for (JsonNode node : rootNode.get("certifications")) {
                Certification cert = new Certification();
                cert.setCandidate(candidate);
                cert.setName(getText(node, "name"));
                cert.setIssuer(getText(node, "issuer"));
                cert.setIssueDate(getDate(node, "issueDate"));
                cert.setCertificateLink(getText(node, "certificateLink"));
                certificationRepository.save(cert);
            }
        }

        // 10. Save Extracted Skills (normalized, confidence-scored)
        if (rootNode.has("skills")) {
            for (JsonNode node : rootNode.get("skills")) {
                String skillName = getText(node, "skillName");
                if (skillName == null || skillName.isBlank()) continue;

                ExtractedSkill es = new ExtractedSkill();
                es.setCandidate(candidate);
                es.setSkillName(skillName);
                es.setCategory(getText(node, "category"));
                es.setConfidenceScore(getFloat(node, "confidenceScore"));
                extractedSkillRepository.save(es);
            }
        }
        return "Success";
    }

    // --- UPDATED GEMINI API CALLER WITH CORRECT MODEL ---
    private String callGeminiApi(String resumeText) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .temperature(0.0f)
                .build();

        // Strict JSON Prompt
        String prompt =
        "You are a resume parser. Extract structured data from the resume text into STRICT JSON.\n" +
        "Keys: name, email, phone, linkedinUrl, githubUrl, portfolioUrl, education, workExperience, projects, certifications, skills.\n" +
        "Dates: YYYY-MM-DD. If missing, use null.\n" +
        "JSON Structure:\n" +
        "{\n" +
        "  \"name\": \"\",\n" +
        "  \"email\": \"\",\n" +
        "  \"phone\": \"\",\n" +
        "  \"linkedinUrl\": \"\",\n" +
        "  \"githubUrl\": \"\",\n" +
        "  \"portfolioUrl\": \"\",\n" +
        "  \"education\": [\n" +
        "    {\n" +
        "      \"degree\": \"\",\n" +
        "      \"institution\": \"\",\n" +
        "      \"fieldOfStudy\": \"\",\n" +
        "      \"startDate\": \"\",\n" +
        "      \"endDate\": \"\",\n" +
        "      \"gpa\": null\n" +
        "    }\n" +
        "  ],\n" +
        "  \"workExperience\": [\n" +
        "    {\n" +
        "      \"jobTitle\": \"\",\n" +
        "      \"company\": \"\",\n" +
        "      \"startDate\": \"\",\n" +
        "      \"endDate\": \"\",\n" +
        "      \"description\": \"\"\n" +
        "    }\n" +
        "  ],\n" +
        "  \"projects\": [\n" +
        "    {\n" +
        "      \"title\": \"\",\n" +
        "      \"description\": \"\",\n" +
        "      \"techStack\": \"\",\n" +
        "      \"githubLink\": \"\",\n" +
        "      \"liveLink\": \"\"\n" +
        "    }\n" +
        "  ],\n" +
        "  \"certifications\": [\n" +
        "    {\n" +
        "      \"name\": \"\",\n" +
        "      \"issuer\": \"\",\n" +
        "      \"issueDate\": \"\",\n" +
        "      \"certificateLink\": \"\"\n" +
        "    }\n" +
        "  ],\n" +
        "  \"skills\": [\n" +
        "    {\n" +
        "      \"skillName\": \"\",\n" +
        "      \"category\": \"\",\n" +
        "      \"confidenceScore\": 0.0\n" +
        "    }\n" +
        "  ]\n" +
        "}\n\n" +
        "RESUME TEXT:\n" +
        resumeText;

        try {
            // 3. Call Model using the injected Client bean
            // NOTE: 'gemini-1.5-flash' is the most stable. 2.5-flash does not exist yet.
            // 2.0-flash is experimental. Use 1.5-flash for reliability.
            GenerateContentResponse response = geminiClient.models.generateContent(
                    "gemini-2.5-flash",
                    prompt,
                    config
            );

            // 4. Clean Response
            String rawJson = response.text();
            return rawJson.replaceAll("(?i)^\\s*```json\\s*", "")
                    .replaceAll("\\s*```\\s*$", "")
                    .trim();

        } catch (Exception e) {
            throw new RuntimeException("Gemini SDK Error: " + e.getMessage(), e);
        }
    }

    // --- Helper Methods to safely extract JSON fields ---
    private String getText(JsonNode node, String key) {
        return node.has(key) && !node.get(key).isNull() ? node.get(key).asText() : null;
    }
    
    private Integer getInt(JsonNode node, String key) {
        return node.has(key) && !node.get(key).isNull() ? node.get(key).asInt() : null;
    }
    
    private Float getFloat(JsonNode node, String key) {
        return node.has(key) && !node.get(key).isNull() ? (float) node.get(key).asDouble() : null;
    }
    
    private Boolean getBool(JsonNode node, String key) {
        return node.has(key) && !node.get(key).isNull() && node.get(key).asBoolean();
    }
    
    private LocalDate getDate(JsonNode node, String key) {
        try {
            String dateStr = getText(node, key);
            return dateStr != null ? LocalDate.parse(dateStr) : null;
        } catch (Exception e) { 
            return null; 
        }
    }
}