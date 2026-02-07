package com.resumeshortlist.resume_shortlist_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import com.fasterxml.jackson.annotation.JsonIgnore; // Import this

@Entity
@Table(name = "score_breakdowns")
@Data
@NoArgsConstructor
public class ScoreBreakdown {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String category;   // e.g., "Format"
    private int score;         // e.g., 12
    private int maxScore;      // e.g., 15
    
    @Column(length = 1000) // Allow longer text for feedback
    private String feedback;   

    @ManyToOne
    @JoinColumn(name = "candidate_score_id")
    @JsonIgnore             // <--- CRITICAL FIX: Stops infinite loop/crash
    @ToString.Exclude       // <--- CRITICAL FIX: Stops stack overflow in logs
    private CandidateScore candidateScore;

    public ScoreBreakdown(String category, int score, int maxScore, String feedback) {
        this.category = category;
        this.score = score;
        this.maxScore = maxScore;
        this.feedback = feedback;
    }
}