package com.resumeshortlist.resume_shortlist_backend.service;

import com.resumeshortlist.resume_shortlist_backend.task.ScoringTask;
import org.springframework.stereotype.Service;

@Service
public class ScoringService {
    private final ScoringTask scoringTask;

    public ScoringService(ScoringTask scoringTask) {
        this.scoringTask = scoringTask;
    }

    public void triggerScoring(Long jobId) {
        scoringTask.scoreCandidatesForJob(jobId); // Runs async
    }
}
