package com.resumeshortlist.resume_shortlist_backend.service;

import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import com.resumeshortlist.resume_shortlist_backend.entity.Resume;
import com.resumeshortlist.resume_shortlist_backend.entity.User;
import com.resumeshortlist.resume_shortlist_backend.repository.JobPostingRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.ResumeRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CleanupService {

    @Autowired private UserRepository userRepository;
    @Autowired private JobPostingRepository jobPostingRepository;
    @Autowired private ResumeRepository resumeRepository;

    @Transactional
    public void flushUserData(Long userId) {
        // 1. Find the User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        // 2. Delete Job Postings
        // (Because of Cascade settings, this deletes RequiredSkills and CandidateScores automatically)
        List<JobPosting> jobs = jobPostingRepository.findByCreatedBy(user); // Make sure this method exists in Repo
        if (!jobs.isEmpty()) {
            jobPostingRepository.deleteAll(jobs);
        }

        // 3. Delete Resumes
        // (Because of Cascade settings, this deletes Candidate, Education, Skills, etc.)
        List<Resume> resumes = resumeRepository.findByUploadedBy(user); // Make sure this method exists in Repo
        if (!resumes.isEmpty()) {
            resumeRepository.deleteAll(resumes);
        }

        System.out.println("✅ All data flushed for User ID: " + userId);
    }
}
