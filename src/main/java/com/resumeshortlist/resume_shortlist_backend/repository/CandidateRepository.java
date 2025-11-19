package com.resumeshortlist.resume_shortlist_backend.repository;

import com.resumeshortlist.resume_shortlist_backend.entity.Candidate;
import com.resumeshortlist.resume_shortlist_backend.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    Optional<Candidate> findByResume(Resume resume);
    Optional<Candidate> findByEmail(String email);
    List<Candidate> findByNameContainingIgnoreCase(String name);

    @Query("SELECT c FROM Candidate c JOIN Resume r ON c.resumeId = r.id " +
            "JOIN JobApplication ja ON r.id = ja.resumeId WHERE ja.jobId = :jobId")
    List<Candidate> findByJobId(@Param("jobId") Long jobId);
}