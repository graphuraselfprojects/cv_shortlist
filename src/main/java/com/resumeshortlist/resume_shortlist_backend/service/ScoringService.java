package com.resumeshortlist.resume_shortlist_backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.resumeshortlist.resume_shortlist_backend.entity.*;
import com.resumeshortlist.resume_shortlist_backend.repository.*;
import com.resumeshortlist.resume_shortlist_backend.exception.ResourceNotFoundException;

@Service
public class ScoringService {

    @Autowired private CandidateRepository candidateRepository;
    @Autowired private JobPostingRepository jobPostingRepository;
    @Autowired private CandidateScoreRepository candidateScoreRepository;
    @Autowired private EducationRepository educationRepository;
    @Autowired private ExtractedSkillRepository extractedSkillRepository;
    @Autowired private RequiredSkillRepository requiredSkillRepository;
    @Autowired private WorkExperienceRepository workExperienceRepository;
    @Autowired private CertificationRepository certificationRepository;
    @Autowired private ProjectRepository projectRepository;

    private boolean hasText(String str) {
        return str != null && !str.trim().isEmpty();
    }

    @Transactional
    public void triggerScoring(Long jobId, List<Long> newCandidateIds) {
        if (!jobPostingRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job ID " + jobId + " not found");
        }
        for (Long candId : newCandidateIds) {
            try {
                if (candidateRepository.existsById(candId)) {
                    System.out.println("Processing Candidate ID: " + candId);
                    calculateAndSaveScore(candId, jobId);
                    System.out.println("✅ Success: Candidate ID " + candId);
                }
            } catch (Exception e) {
                System.err.println("❌ Error processing Candidate ID " + candId + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void calculateAndSaveScore(Long candidateId, Long jobPostingId) {
        Candidate candidate = candidateRepository.findById(candidateId).orElseThrow();
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId).orElseThrow();

        List<ScoreBreakdown> breakdowns = new ArrayList<>();
        int totalScore = 0;

        // Fetch Data
        List<Education> educations = educationRepository.findByCandidateId(candidateId);
        List<WorkExperience> workEx = workExperienceRepository.findByCandidateId(candidateId);
        List<ExtractedSkill> skills = extractedSkillRepository.findByCandidateId(candidateId);
        List<Project> projects = projectRepository.findByCandidateId(candidateId);
        List<Certification> certs = certificationRepository.findByCandidateId(candidateId);

        // --- 1. Format (15 pts) ---
        int formatScore = 0;
        List<String> formatTips = new ArrayList<>();
        if (!educations.isEmpty() && !workEx.isEmpty() && !skills.isEmpty()) formatScore += 5;
        else formatTips.add("Missing core sections (Edu/Exp/Skills).");
        
        if (hasText(candidate.getName()) && hasText(candidate.getEmail())) formatScore += 3;
        else formatTips.add("Header info missing.");
        
        if (!workEx.isEmpty() && workEx.stream().allMatch(w -> hasText(w.getCompany()))) formatScore += 3;
        else formatTips.add("Inconsistent experience formatting.");
        
        if (!educations.isEmpty()) formatScore += 4;
        
        totalScore += formatScore;
        breakdowns.add(new ScoreBreakdown("Format", formatScore, 15, formatScore == 15 ? "Excellent." : String.join(" ", formatTips)));

        // --- 2. Contact (5 pts) ---
        int contactScore = 0;
        if (hasText(candidate.getPhone())) contactScore += 3;
        if (hasText(candidate.getLinkedinUrl()) || hasText(candidate.getGithubUrl())) contactScore += 2;
        totalScore += contactScore;
        breakdowns.add(new ScoreBreakdown("Contact", contactScore, 5, contactScore == 5 ? "Complete." : "Add Phone/LinkedIn links."));

        // --- 3. Summary (10 pts) ---
        int summaryScore = (skills.size() > 3 && !workEx.isEmpty()) ? 10 : 5;
        totalScore += summaryScore;
        breakdowns.add(new ScoreBreakdown("Summary", summaryScore, 10, "Profile overview check."));

        // --- 4. Skills (15 pts) ---
        int skillScore = 0;
        List<String> skillTips = new ArrayList<>();
        List<RequiredSkill> required = requiredSkillRepository.findByJobPostingId(jobPostingId);
        
        if (required != null && !required.isEmpty() && !skills.isEmpty()) {
            Set<String> candSkills = skills.stream().map(s -> s.getSkillName().toLowerCase().trim()).collect(Collectors.toSet());
            long matchCount = required.stream().filter(r -> candSkills.contains(r.getSkillName().toLowerCase().trim())).count();
            double ratio = (double) matchCount / required.size();

            if (ratio >= 0.8) skillScore += 7;
            else if (ratio >= 0.5) { skillScore += 4; skillTips.add("Add more matching JD skills."); }
            else { skillScore += 2; skillTips.add("Low skill match. Tailor resume."); }

            if (skills.stream().anyMatch(s -> "TECHNICAL".equalsIgnoreCase(s.getCategory()))) skillScore += 3;
            else skillTips.add("Highlight technical hard skills.");
            
            if (matchCount > 0) skillScore += 5; // Bonus for relevance
        } else {
            skillTips.add("No skills extracted.");
        }
        int finalSkillScore = Math.min(skillScore, 15);
        totalScore += finalSkillScore;
        breakdowns.add(new ScoreBreakdown("Skills", finalSkillScore, 15, finalSkillScore >= 14 ? "Strong match." : String.join(" ", skillTips)));

        // --- 5. Experience (20 pts) ---
        int expScore = 0;
        List<String> expTips = new ArrayList<>();
        if (!workEx.isEmpty()) {
            expScore += 5; // Has experience
            if (workEx.stream().anyMatch(w -> w.getDescription() != null && w.getDescription().length() > 50)) expScore += 5;
            else expTips.add("Expand job descriptions.");
            
            if (workEx.stream().anyMatch(w -> w.getDescription() != null && w.getDescription().matches(".*\\d+.*"))) expScore += 10; // Numbers/Metrics
            else expTips.add("Add quantified achievements (numbers/%) to boost score.");
        } else {
            expTips.add("No work experience found.");
        }
        totalScore += expScore;
        breakdowns.add(new ScoreBreakdown("Experience", expScore, 20, expScore >= 18 ? "Strong." : String.join(" ", expTips)));

        // --- 6. Projects (15 pts) ---
        int projScore = 0;
        if (!projects.isEmpty()) {
            projScore += 10;
            if (projects.size() >= 2) projScore += 5;
        } 
        totalScore += projScore;
        breakdowns.add(new ScoreBreakdown("Projects", projScore, 15, projScore == 0 ? "Add technical projects." : "Good projects."));

        // --- 7. Education (10 pts) ---
        int eduScore = !educations.isEmpty() ? 10 : 0;
        totalScore += eduScore;
        breakdowns.add(new ScoreBreakdown("Education", eduScore, 10, eduScore == 0 ? "Add education." : "Verified."));

        // --- 8. Certifications (5 pts) ---
        int certScore = !certs.isEmpty() ? 5 : 0;
        totalScore += certScore;
        breakdowns.add(new ScoreBreakdown("Certifications", certScore, 5, certScore == 0 ? "Add certifications." : "Verified."));

        // --- 9. Extras (5 pts) ---
        totalScore += 5; // Baseline for grammar/tone
        breakdowns.add(new ScoreBreakdown("Tone/Grammar", 5, 5, "Professional tone check."));

        // --- SAVE ---
        String status = (totalScore >= 75) ? "SHORTLISTED" : (totalScore >= 50) ? "CONSIDER" : "REJECTED";

        Optional<CandidateScore> existing = candidateScoreRepository.findByCandidateAndJobPosting(candidate, jobPosting);
        CandidateScore scoreEntity = existing.orElse(new CandidateScore());
        scoreEntity.setCandidate(candidate);
        scoreEntity.setJobPosting(jobPosting);
        scoreEntity.setTotalScore(totalScore);
        scoreEntity.setStatus(status);
        scoreEntity.setScoredAt(LocalDateTime.now());

        // Manage Breakdowns
        if(scoreEntity.getScoreBreakdowns() == null) scoreEntity.setScoreBreakdowns(new ArrayList<>());
        scoreEntity.getScoreBreakdowns().clear();
        
        for(ScoreBreakdown b : breakdowns) {
            b.setCandidateScore(scoreEntity);
            scoreEntity.getScoreBreakdowns().add(b);
        }

        candidateScoreRepository.save(scoreEntity);
    }
}