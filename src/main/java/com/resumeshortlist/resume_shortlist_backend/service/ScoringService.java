package com.resumeshortlist.resume_shortlist_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.resumeshortlist.resume_shortlist_backend.entity.Candidate;
import com.resumeshortlist.resume_shortlist_backend.entity.CandidateScore;
import com.resumeshortlist.resume_shortlist_backend.entity.Certification;
import com.resumeshortlist.resume_shortlist_backend.entity.Education;
import com.resumeshortlist.resume_shortlist_backend.entity.ExtractedSkill;
import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import com.resumeshortlist.resume_shortlist_backend.entity.Project;
import com.resumeshortlist.resume_shortlist_backend.entity.RequiredSkill;
import com.resumeshortlist.resume_shortlist_backend.entity.WorkExperience;
import com.resumeshortlist.resume_shortlist_backend.exception.ResourceNotFoundException;
import com.resumeshortlist.resume_shortlist_backend.repository.CandidateRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.CandidateScoreRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.CertificationRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.EducationRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.ExtractedSkillRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.JobPostingRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.ProjectRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.RequiredSkillRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.WorkExperienceRepository;
import com.resumeshortlist.resume_shortlist_backend.task.ScoringTask;
@Service
public class ScoringService {

    @Autowired private CandidateRepository candidateRepository;
    @Autowired private JobPostingRepository jobPostingRepository;
    @Autowired private CandidateScoreRepository candidateScoreRepository;

    @Autowired
    private EducationRepository educationRepository;
    @Autowired private ExtractedSkillRepository extractedSkillRepository;
    @Autowired private RequiredSkillRepository requiredSkillRepository;
    @Autowired private WorkExperienceRepository workExperienceRepository;
    @Autowired private CertificationRepository certificationRepository;
    @Autowired private ProjectRepository projectRepository;
    private final ScoringTask scoringTask;

    public ScoringService(ScoringTask scoringTask) {
        this.scoringTask = scoringTask;
    }

    // @Transactional
    // public void triggerScoring(Long jobId) {
    //     List<Candidate> allCandidates = candidateRepository.findAll();

    //     for (Candidate candidate : allCandidates) {
    //         calculateAndSaveScore(candidate.getId(), jobId);
    //     }
    // }

//     @Transactional
// public void triggerScoring(Long jobId, List<Long> newCandidateIds) { // Sirf naye IDs lein
//     for (Long candId : newCandidateIds) {
//         calculateAndSaveScore(candId, jobId);
//     }
// }

// @Transactional
// public void triggerScoring(Long jobId, List<Long> newCandidateIds) {
//     // 1. Pehle purane scores delete karein taaki dashboard sirf naye results dikhaye
//     // Note: Iske liye Repository mein deleteByJobPostingId method hona chahiye
//     candidateScoreRepository.deleteByJobPostingId(jobId);

//     // 2. Sirf naye candidates ko score karein
//     for (Long candId : newCandidateIds) {
//         calculateAndSaveScore(candId, jobId);
//     }
// }

// ScoringService.java ke andar ye wala method rakhein jo List handle kare
@Transactional
public void triggerScoring(Long jobId, List<Long> newCandidateIds) {
    // 1. Check karein ki Job exist karti hai ya nahi
    if (!jobPostingRepository.existsById(jobId)) {
        throw new ResourceNotFoundException("Job ID " + jobId + " not found");
    }

    // 2. Loop chala kar har candidate ko score karein
    for (Long candId : newCandidateIds) {
       try {
            // Check if candidate exists
            if (candidateRepository.existsById(candId)) {
                System.out.println("Processing Candidate ID: " + candId);
                
                // --- THE KEY CHANGE IS HERE ---
                // We run the calculation inside this TRY block.
                calculateAndSaveScore(candId, jobId);
                
                System.out.println("✅ Success: Candidate ID " + candId);
            }
        } catch (Exception e) {
            // If Candidate A crashes, we catch the error here.
            // The loop will NOT stop. It will proceed to Candidate B.
            System.err.println("❌ Error processing Candidate ID " + candId + ": " + e.getMessage());
            e.printStackTrace(); 
        }
    }
}

private boolean hasText(String str) {
    return str != null && !str.trim().isEmpty();
}

public void calculateAndSaveScore(Long candidateId, Long jobPostingId) {
    Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new RuntimeException("Candidate not found"));
    JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
            .orElseThrow(() -> new RuntimeException("Job Posting not found"));

    int totalScore = 0;

    // --- 1. Education (+2) ---
    List<Education> educations = educationRepository.findByCandidateId(candidateId);
    if (educations != null && educations.stream().anyMatch(e -> hasText(e.getDegree()))) {
        totalScore += 2;
    }

    // --- 2. Profile Links (+1) ---
    if (hasText(candidate.getLinkedinUrl()) || hasText(candidate.getPortfolioUrl()) || hasText(candidate.getGithubUrl())) {
        totalScore += 1;
    }

    // --- 3. Skills (+3) ---
    List<ExtractedSkill> candidateSkills = extractedSkillRepository.findByCandidateId(candidateId);
    List<RequiredSkill> requiredSkills = requiredSkillRepository.findByJobPostingId(jobPostingId);

    if (candidateSkills != null && requiredSkills != null) {
        Set<String> candSkillNames = candidateSkills.stream()
                .filter(s -> hasText(s.getSkillName()))
                .map(s -> s.getSkillName().toLowerCase().trim())
                .collect(Collectors.toSet());

        long matchCount = requiredSkills.stream()
                .filter(rs -> hasText(rs.getSkillName()) && candSkillNames.contains(rs.getSkillName().toLowerCase().trim()))
                .count();

        if (matchCount >= 2) totalScore += 3;

        // --- 4. Tech + Tools (+3) ---
        boolean hasTech = candidateSkills.stream().anyMatch(s -> "TECHNICAL".equalsIgnoreCase(s.getCategory()));
        boolean hasTool = candidateSkills.stream().anyMatch(s -> "TOOL".equalsIgnoreCase(s.getCategory()));
        if (hasTech && hasTool) totalScore += 3;
    }

    // --- 5. Work Experience (+5) ---
    List<WorkExperience> workExperiences = workExperienceRepository.findByCandidateId(candidateId);
    if (workExperiences != null && workExperiences.stream().anyMatch(w -> hasText(w.getJobTitle()))) {
        totalScore += 5;
    }

    // --- 6. Certifications (+5) ---
    List<Certification> certifications = certificationRepository.findByCandidateId(candidateId);
    if (certifications != null && !certifications.isEmpty()) {
        totalScore += 5;
    }

    // --- 7. Projects (+5) ---
    List<Project> projects = projectRepository.findByCandidateId(candidateId);
    if (projects != null && projects.size() >= 2) {
        totalScore += 5;
    }

    // --- 8. Education Bonus (Max 6) ---
    if (educations != null) {
        int eduExtraScore = 0;
        for (Education edu : educations) {
            int currentEduScore = 0;
            if (hasText(edu.getInstitution())) currentEduScore += 2;
            if (edu.getEndYear() != null) currentEduScore += 2;
            if (edu.getGpa() != null) currentEduScore += 1;
            if (hasText(edu.getFieldOfStudy())) currentEduScore += 1;
            eduExtraScore = Math.max(eduExtraScore, currentEduScore);
        }
        totalScore += Math.min(eduExtraScore, 6);
    }

    // --- Status Calculation ---
    String status = (totalScore >= 18) ? "SHORTLISTED" : (totalScore >= 15) ? "CONSIDER" : "REJECTED";

    // --- Save Score ---
    Optional<CandidateScore> existing = candidateScoreRepository.findByCandidateAndJobPosting(candidate, jobPosting);
    CandidateScore scoreEntity = existing.orElse(new CandidateScore());
    scoreEntity.setCandidate(candidate);
    scoreEntity.setJobPosting(jobPosting);
    scoreEntity.setTotalScore(totalScore);
    scoreEntity.setStatus(status);
    scoreEntity.setScoredAt(LocalDateTime.now());

    candidateScoreRepository.save(scoreEntity);
    System.out.println("✅ Saved Score: " + totalScore + " for Candidate: " + candidate.getName());
}
}
