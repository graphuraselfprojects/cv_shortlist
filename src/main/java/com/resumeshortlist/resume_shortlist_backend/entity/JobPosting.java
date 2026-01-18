package com.resumeshortlist.resume_shortlist_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "job_postings")
@Data
@NoArgsConstructor
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String department;

    @Column(columnDefinition = "TEXT")
    private String description;
    // new fields added 
    private String fileName;
    private String filePath;
    private String fileType;

    private Integer minExperienceYears;

    private String educationLevel;

    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    // @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<RequiredSkill> requiredSkills;
    
    // // If scores are also linked to jobs, cascade them here too
    // @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, orphanRemoval = true)
    // private List<CandidateScore> candidateScores;
}
