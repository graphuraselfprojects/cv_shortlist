package com.resumeshortlist.resume_shortlist_backend.dto;

import java.time.LocalDateTime;

public record DashboardResponse(Long candidateId,
                                String candidateName,
                                String email,
                                String resumeFile,
                                Float totalScore,
                                Integer rank,
                                String status,
                                LocalDateTime scoredAt) {
}
