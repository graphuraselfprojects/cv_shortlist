package com.resumeshortlist.resume_shortlist_backend.service;

import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import com.resumeshortlist.resume_shortlist_backend.entity.Resume;
import com.resumeshortlist.resume_shortlist_backend.entity.User;
import com.resumeshortlist.resume_shortlist_backend.repository.JobPostingRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.ResumeRepository;
import com.resumeshortlist.resume_shortlist_backend.repository.UserRepository;
// If you have a Score Repository, include it. If not, the Cascade in Step 1 handles it.
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
    public void flushUserData(String userEmail) {
        // 1. Find User
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 2. Delete Job Postings
        // (This automatically deletes RequiredSkills and linked Scores)
        List<JobPosting> jobs = jobPostingRepository.findByCreatedBy(user);
        jobPostingRepository.deleteAll(jobs);

        // 3. Delete Resumes
        // (This automatically deletes Candidate -> Education, Projects, Scores, Breakdowns)
        List<Resume> resumes = resumeRepository.findByUploadedBy(user);
        resumeRepository.deleteAll(resumes);
    }
}