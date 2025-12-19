package com.resumeshortlist.resume_shortlist_backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.*;

@Service
public class JobDescriptionParsingService {

    @Autowired
    private Client geminiClient;

    private final Tika tika = new Tika();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // --- HARDCODED SKILL DATASETS ---
    private static final Set<String> TECHNICAL_SKILLS = new HashSet<>();
    private static final Set<String> TOOL_SKILLS = new HashSet<>();
    private static final Set<String> SOFT_SKILLS = new HashSet<>();

    static {
        // 1️⃣ TECHNICAL SKILLS
        TECHNICAL_SKILLS.addAll(Arrays.asList(
                "DATA ANALYTICS", "DATA MODELING", "MACHINE LEARNING", "ETL PROCESSING", "PREDICTIVE ANALYTICS",
                "STATISTICAL ANALYSIS", "DATA VISUALIZATION", "A/B TESTING", "RECRUITMENT", "HR OPERATIONS",
                "INTERVIEWING", "PAYROLL PROCESSING", "HR COMPLIANCE", "TALENT ACQUISITION", "SOCIAL CAMPAIGN STRATEGY",
                "AUDIENCE TARGETING", "COMMUNITY MANAGEMENT", "SEO", "SEM", "PPC", "BRAND BUILDING", "ILLUSTRATION",
                "TYPOGRAPHY", "PRINT DESIGN", "LAYOUT DESIGN", "BRANDING", "DIGITAL GRAPHICS", "FUNNEL OPTIMIZATION",
                "MARKETING AUTOMATION", "LEAD GENERATION", "WEB ANALYTICS", "MOTION GRAPHICS", "COLOR CORRECTION",
                "STORYBOARDING", "AUDIO SYNCING", "VISUAL EFFECTS", "REST API DEVELOPMENT", "DATABASE DESIGN",
                "MVC ARCHITECTURE", "CLOUD DEPLOYMENT", "VERSION CONTROL", "RESPONSIVE WEB DEVELOPMENT",
                "AUTHENTICATION/AUTHORIZATION", "CI/CD", "DATA STRUCTURES", "API DEVELOPMENT", "STATE MANAGEMENT",
                "ROUTING", "DEBUGGING", "CRM MANAGEMENT", "EMAIL CAMPAIGNING", "PROSPECTING", "SCRIPTWRITING",
                "COPYWRITING", "BLOG WRITING", "RESEARCH WRITING", "EDITING", "PROOFREADING", "CAMERA OPERATION",
                "USER RESEARCH", "WIREFRAMING", "PROTOTYPING", "INFORMATION ARCHITECTURE", "USABILITY TESTING",
                "INTERACTION DESIGN", "ACCESSIBILITY", "COMPONENT ARCHITECTURE", "DOM HANDLING", "PERFORMANCE OPTIMIZATION",
                "CACHING", "APPLICATION SECURITY", "SERVER-SIDE LOGIC", "SCALABILITY", "DATABASE QUERYING", "CLOUD INTEGRATION"
        ));

        // 2️⃣ TOOL / SOFTWARE SKILLS
        TOOL_SKILLS.addAll(Arrays.asList(
                "PYTHON", "R", "SQL", "POWER BI", "TABLEAU", "EXCEL", "NUMPY", "PANDAS", "TENSORFLOW", "HRMS",
                "ATS SYSTEMS", "WORKDAY", "BAMBOOHR", "ORACLE HR", "META BUSINESS SUITE", "HOOTSUITE", "CANVA",
                "BUFFER", "GOOGLE ANALYTICS", "LINKEDIN CAMPAIGN MANAGER", "ADOBE PHOTOSHOP", "ADOBE ILLUSTRATOR",
                "ADOBE INDESIGN", "FIGMA", "CORELDRAW", "ADOBE LIGHTROOM", "GOOGLE ADS", "SEMRUSH", "AHREFS",
                "HUBSPOT", "MAILCHIMP", "DAVINCI RESOLVE", "FINAL CUT PRO", "ADOBE PREMIERE PRO", "AFTER EFFECTS",
                "FILMORA", "GIT", "DOCKER", "NODE.JS", "REACT.JS", "EXPRESS.JS", "MONGODB", "MYSQL", "VS CODE",
                "APOLLO.IO", "SALESFORCE", "GRAMMARLY", "HEMINGWAY EDITOR", "SURFERSEO", "WORDPRESS", "GOOGLE DOCS",
                "MS WORD", "CAPCUT", "VN EDITOR", "YOUTUBE STUDIO", "ADOBE XD", "SKETCH", "INVISION", "BALSAMIQ",
                "MIRO", "ZEPLIN", "ANGULAR", "TAILWIND CSS", "WEBPACK", "REDIS"
        ));

        // 3️⃣ SOFT SKILLS
        SOFT_SKILLS.addAll(Arrays.asList(
                "CRITICAL THINKING", "PROBLEM-SOLVING", "ANALYTICAL REASONING", "DECISION-MAKING", "COMMUNICATION",
                "CONFLICT RESOLUTION", "EMPATHY", "TEAMWORK", "ORGANIZATION", "CREATIVITY", "ADAPTABILITY",
                "TIME MANAGEMENT", "ATTENTION TO DETAIL", "VISUALIZATION", "TREND AWARENESS", "STORYTELLING",
                "STRATEGY PLANNING", "PERSUASION", "RESEARCH ABILITY", "FOLLOW-UP DISCIPLINE", "RELATIONSHIP BUILDING",
                "CONSISTENCY", "USER-CENTRIC THINKING", "DOCUMENTATION ABILITY", "COLLABORATION", "LOGICAL REASONING"
        ));
    }

    public JobPosting parseJobDescription(File file) {
        JobPosting extractedData = new JobPosting();
        try {
            // 1. Extract Text
            String text = tika.parseToString(file);

            // 2. Call Gemini (Kept Gemini logic here for JD Extraction as requested)
            String jsonResponse = callGeminiApi(text);

            // 3. Map to Entity
            JsonNode root = objectMapper.readTree(jsonResponse);

            extractedData.setTitle(getText(root, "title"));
            extractedData.setDepartment(getText(root, "department"));
            extractedData.setDescription(getText(root, "description"));
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

    // --- UPDATED: HARDCODED LOGIC (NO GEMINI) ---
    public Map<String, String> categorizeSkills(List<String> skills) {
        Map<String, String> skillCategoryMap = new HashMap<>();

        if (skills == null || skills.isEmpty()) return skillCategoryMap;

        for (String skill : skills) {
            if (skill == null) continue;

            // Normalize for comparison
            String normalizedSkill = skill.trim().toUpperCase();

            // Classification Priority: Tool -> Technical -> Soft -> Default (Technical)
            if (TOOL_SKILLS.contains(normalizedSkill)) {
                skillCategoryMap.put(skill, "TOOL");
            } else if (TECHNICAL_SKILLS.contains(normalizedSkill)) {
                skillCategoryMap.put(skill, "TECHNICAL");
            } else if (SOFT_SKILLS.contains(normalizedSkill)) {
                skillCategoryMap.put(skill, "SOFT");
            } else {
                // Fallback for unknown skills
                skillCategoryMap.put(skill, "TECHNICAL");
            }
        }
        return skillCategoryMap;
    }

    private String callGeminiApi(String text) {
        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .temperature(0.0f)
                .build();

        String prompt = "Extract structured data from this Job Description into STRICT JSON.\n" +
                "Keys: title, department, description (summarized, max 500 chars), minExperienceYears (integer), educationLevel.\n" +
                "JSON Structure:\n" +
                "{ \"title\": \"\", \"department\": \"\", \"description\": \"\", \"minExperienceYears\": 0, \"educationLevel\": \"\" }\n" +
                "JOB DESCRIPTION TEXT:\n" + text;

        try {
            // Updated model to gemini-1.5-flash (2.5 does not exist and will crash)
            GenerateContentResponse response = geminiClient.models.generateContent(
                    "gemini-2.5-flash",
                    prompt,
                    config
            );

            // Clean Response
            String rawJson = response.text();
            return rawJson.replaceAll("(?i)^\\s*```json\\s*", "")
                    .replaceAll("\\s*```\\s*$", "")
                    .trim();

        } catch (Exception e) {
            throw new RuntimeException("Gemini SDK Error: " + e.getMessage(), e);
        }
    }

    private String getText(JsonNode node, String key) { return node.has(key) && !node.get(key).isNull() ? node.get(key).asText() : null; }
    private Integer getInt(JsonNode node, String key) { return node.has(key) && !node.get(key).isNull() ? node.get(key).asInt() : null; }
}