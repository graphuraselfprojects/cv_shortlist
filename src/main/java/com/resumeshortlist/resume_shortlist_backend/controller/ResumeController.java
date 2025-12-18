package com.resumeshortlist.resume_shortlist_backend.controller;

import com.resumeshortlist.resume_shortlist_backend.entity.Resume;
import com.resumeshortlist.resume_shortlist_backend.service.FileUploadService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.resumeshortlist.resume_shortlist_backend.service.ResumeParsingService;


@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final FileUploadService FileUploadService;
    @Autowired
    private ResumeParsingService resumeParsingService;
    // 🎯 API #7 Upload Multiple Resumes
    @PostMapping("/upload/{userId}")
    public ResponseEntity<?> uploadResumes(
            @PathVariable Long userId,
            @RequestPart("files") MultipartFile[] files) {
        try {
            // Only saves the file to disk and DB. Does NOT trigger Gemini yet.
            List<Resume> saved = FileUploadService.uploadMultipleResumes(userId, files);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed: " + e.getMessage());
        }
    }

    // 🎯 API #8 Get All Resumes Uploaded by Specific User
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Resume>> getResumesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(FileUploadService.getAllResumesByUser(userId));
    }

    @PostMapping("/analyze/all/{userId}")
    public ResponseEntity<?> analyzeAllResumes(@PathVariable Long userId) {
        System.out.println("Starting");
        try {
            List<Resume> userResumes = FileUploadService.getAllResumesByUser(userId);
            int processedCount = 0;
            int skippedCount = 0;

            for (Resume resume : userResumes) {
                try {
                    String status = resumeParsingService.parseAndSaveResume(resume.getId());
                    if ("Success".equals(status)) {
                        processedCount++;
                    } else {
                        skippedCount++;
                    }
                } catch (Exception e) {
                    System.err.println("Failed to parse resume ID " + resume.getId() + ": " + e.getMessage());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Analysis Complete");
            response.put("processed", processedCount);
            response.put("skipped", skippedCount);
            response.put("total", userResumes.size());
            
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Batch Analysis failed: " + e.getMessage());
        }
    }

    @PostMapping("/parse/{resumeId}")
    public ResponseEntity<?> parseResume(@PathVariable Long resumeId) {
        try {
            resumeParsingService.parseAndSaveResume(resumeId);
            return ResponseEntity.ok("Resume parsed and data extracted successfully!");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Parsing failed: " + e.getMessage());
        }
    }
}
