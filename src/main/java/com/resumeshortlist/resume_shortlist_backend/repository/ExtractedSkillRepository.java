package com.resumeshortlist.resume_shortlist_backend.repository;

import com.resumeshortlist.resume_shortlist_backend.entity.Candidate;
import com.resumeshortlist.resume_shortlist_backend.entity.ExtractedSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExtractedSkillRepository extends JpaRepository<ExtractedSkill, Long> {
    List<ExtractedSkill> findByCandidate(Candidate candidate);
    List<ExtractedSkill> findByCandidateId(Long candidateId);
    List<ExtractedSkill> findBySkillNameContainingIgnoreCase(String skillName);
    Optional<ExtractedSkill> findByCandidateIdAndSkillName(Long candidateId, String skillName);
}