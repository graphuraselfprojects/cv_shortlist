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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobPostingRepository jobPostingRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Transactional
    public void flushUserData(String userEmail) {
        // 1. Find the logged-in User
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Delete all Job Postings created by this user
        List<JobPosting> jobs = jobPostingRepository.findByCreatedBy(user);
        if (!jobs.isEmpty()) {
            jobPostingRepository.deleteAll(jobs);
        }

        // 3. Delete all Resumes uploaded by this user
        // Note: If you have a 'CandidateScore' or 'Education' table linked to Resume,
        // JPA will cascade delete them automatically if configured correctly.
        List<Resume> resumes = resumeRepository.findByUploadedBy(user);
        if (!resumes.isEmpty()) {
            resumeRepository.deleteAll(resumes);
        }
        
        // The User entity itself remains untouched.
    }
}