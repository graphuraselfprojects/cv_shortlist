package com.resumeshortlist.resume_shortlist_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "candidate_scores")
@Data
@NoArgsConstructor
public class CandidateScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer totalScore;
    private String status;
    private LocalDateTime scoredAt;

    @ManyToOne
    @JoinColumn(name = "candidate_id", nullable = false)
    @JsonIgnore // Prevent recursion going back up to candidate
    @ToString.Exclude
    private Candidate candidate;

    @ManyToOne
    @JoinColumn(name = "job_posting_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private JobPosting jobPosting;

    @OneToMany(mappedBy = "candidateScore", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ScoreBreakdown> scoreBreakdowns = new ArrayList<>();
}