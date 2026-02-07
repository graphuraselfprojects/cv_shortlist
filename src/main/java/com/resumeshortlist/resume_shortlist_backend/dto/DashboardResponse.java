package com.resumeshortlist.resume_shortlist_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import com.resumeshortlist.resume_shortlist_backend.entity.ScoreBreakdown; // Import this

@Data
@AllArgsConstructor
public class DashboardResponse {
    private Long id;
    private String candidateName;
    private String email;
    private String fileName;
    private Integer totalScore;
    private Integer rank;
    private String status;
    private LocalDateTime scoredAt;
    
    // --- ADD THIS ---
    private List<ScoreBreakdown> breakdown; 
}