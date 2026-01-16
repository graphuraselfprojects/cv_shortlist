package com.resumeshortlist.resume_shortlist_backend.controller;

import com.resumeshortlist.resume_shortlist_backend.service.CleanupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cleanup")
public class CleanupController {

    @Autowired
    private CleanupService cleanupService;

    @DeleteMapping("/user-data")
    public ResponseEntity<String> deleteUserData() {
        // Get the email from the Security Context (JWT Token)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        try {
            cleanupService.flushUserData(email);
            return ResponseEntity.ok("User data flushed successfully.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error flushing data: " + e.getMessage());
        }
    }
}