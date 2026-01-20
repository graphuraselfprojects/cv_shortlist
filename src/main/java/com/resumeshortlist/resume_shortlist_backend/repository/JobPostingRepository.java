package com.resumeshortlist.resume_shortlist_backend.repository;

import com.resumeshortlist.resume_shortlist_backend.entity.JobPosting;
import com.resumeshortlist.resume_shortlist_backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    //List<JobPosting> findByCreatedById(Long userId);
    List<JobPosting> findAll();
    List<JobPosting> findByCreatedBy(User user);
    
}