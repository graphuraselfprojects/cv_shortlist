package com.resumeshortlist.resume_shortlist_backend.controller;

import com.resumeshortlist.resume_shortlist_backend.service.CleanupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cleanup")
public class CleanupController {

    @Autowired
    private CleanupService cleanupService;

    @DeleteMapping("/user-data/{userId}")
    public ResponseEntity<?> deleteUserData(@PathVariable Long userId) {
        try {
            cleanupService.flushUserData(userId);
            return ResponseEntity.ok().body("{\"message\": \"User data flushed successfully\"}");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}