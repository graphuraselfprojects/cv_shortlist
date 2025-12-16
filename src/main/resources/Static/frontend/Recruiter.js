// Recruiter page specific behaviour (upload UI + skills). Shared navbar/auth lives in nav.js.

// Route protection - check login on page load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.requireAuth === 'function') {
    if (!window.requireAuth()) {
      return; // Redirect will happen in requireAuth
    }
  } else {
    // Fallback protection
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      window.location.href = 'index.html';
      return;
    }
  }
  
  // Load userId from localStorage if available
  const storedUserId = localStorage.getItem('userId');
  const userIdInput = document.getElementById('userIdInput');
  if (storedUserId && userIdInput) {
    userIdInput.value = storedUserId;
  }
});

if (window.AOS) {
  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    offset: 100,
    mirror: false,
  });
}

const scrollTopBtn = document.getElementById("scrollTopBtn");
if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      scrollTopBtn.classList.remove("translate-y-24", "opacity-0");
      scrollTopBtn.classList.add("translate-y-0", "opacity-100");
    } else {
      scrollTopBtn.classList.add("translate-y-24", "opacity-0");
      scrollTopBtn.classList.remove("translate-y-0", "opacity-100");
    }
  });
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// Resume upload widgets
const resumeFileInput = document.getElementById("resumeFileInput");
const resumeFileList = document.getElementById("resumeFileList");

if (resumeFileInput && resumeFileList) {
  resumeFileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    resumeFileList.innerHTML = "";
    files.forEach((file) => {
      const div = document.createElement("div");
      div.className =
        "flex justify-between items-center bg-brand-dark p-2 rounded border border-gray-700";
      div.innerHTML = `<span>${file.name}</span> <i class="fas fa-check text-green-400"></i>`;
      resumeFileList.appendChild(div);
    });
  });
}

// Job description upload widgets (still local-only; backend parsing is handled on resume upload)
const jdFileInput = document.getElementById("jdFileInput");
const jdFileList = document.getElementById("jdFileList");

if (jdFileInput && jdFileList) {
  jdFileInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files || []);
    jdFileList.innerHTML = "";
    files.forEach((file) => {
      const div = document.createElement("div");
      div.className =
        "flex justify-between items-center bg-brand-dark p-2 rounded border border-gray-700";
      div.innerHTML = `<span>${file.name}</span> <i class="fas fa-check text-green-400"></i>`;
      jdFileList.appendChild(div);
    });
  });
}

// START: Skill Management Functionality
const jobDomainSelect = document.getElementById('jobDomainSelect'); // New ID
const skillSelect = document.getElementById('skillSelect'); 
const skillTagsContainer = document.getElementById('skillTags');

// 1. Define the Skill Map (UPDATED with Social Media Management and Digital Marketing skills)
const domainToSkillsMap = {
    "Select Domain": [], // Default
    "Sales & Marketing": ["Market Research", "SEO", "Content Strategy", "CRM (Salesforce)", "Email Marketing", "Social Media Advertising", "Lead Generation", "Public Relations", "Brand Management"],
    "Data Science & Analytics": ["Python", "R", "SQL", "Machine Learning", "Data Visualization", "Big Data", "Statistical Analysis", "Deep Learning", "Pandas", "NumPy"],
    "Human Resources": ["Recruitment", "Onboarding", "Employee Relations", "HRIS", "Compensation & Benefits", "Labor Law", "Performance Management", "Talent Acquisition"],
    "Social Media Management": ["Instagram Marketing", "Facebook Ads", "Community Management", "TikTok Strategy", "Content Scheduling", "Analytics (e.g., Buffer/Hootsuite)", "Crisis Communication", "Influencer Marketing"], // ADDED
    "Digital Marketing": ["Google Ads", "Search Engine Optimization (SEO)", "Pay-Per-Click (PPC)", "Google Analytics", "Content Marketing", "Conversion Rate Optimization (CRO)", "Email Marketing", "Marketing Automation", "HubSpot"], // ADDED
    "Graphic Design": ["Adobe Photoshop", "Adobe Illustrator", "InDesign", "Branding", "Typography", "UI/UX Design", "Print Design", "Vector Graphics", "Figma"],
    "Video Editing": ["Adobe Premiere Pro", "Final Cut Pro", "Motion Graphics", "Color Correction", "Sound Design", "After Effects", "Davinci Resolve"],
    "Full Stack Developer": ["JavaScript", "Node.js", "React", "Python", "Databases (SQL/NoSQL)", "Cloud (AWS/Azure)", "REST APIs", "Security", "Git"],
    "MERN Stack Developer": ["MongoDB", "Express.js", "React", "Node.js", "Redux", "REST APIs", "Mongoose", "Authentication (JWT)"],
    "E-Mail & Outreaching": ["Cold Emailing", "Outreach Tools", "A/B Testing", "Sequencing", "Lead Generation", "HubSpot", "Mailchimp", "Email Automation"],
    "Content Writing": ["Blogging", "Copywriting", "SEO Content", "Technical Writing", "Editing", "Grammarly", "Research", "Content Strategy"],
    "Content Creator": ["Videography", "Scripting", "Social Media Strategy", "Community Management", "Live Streaming", "Storytelling", "Adobe Creative Suite"],
    "UI/UX Designing": ["Figma", "Sketch", "Prototyping", "User Research", "Wireframing", "Usability Testing", "Design Systems", "Adobe XD"],
    "Front-End Developer": ["HTML/CSS", "JavaScript", "React/Vue/Angular", "Tailwind CSS", "Responsive Design", "Webpack", "SASS/LESS", "Accessibility"],
    "Back-End Developer": ["Node.js/Python/Java", "Database Design", "API Development", "Security", "Server Management", "Microservices", "Docker", "Testing"],
};

if (jobDomainSelect && skillSelect && skillTagsContainer) {

    // Function to dynamically update skill options based on domain
    function updateSkillOptions() {
        const selectedDomain = jobDomainSelect.value;
        const skills = domainToSkillsMap[selectedDomain] || [];

        // Clear existing options
        skillSelect.innerHTML = '<option disabled selected value="">Select a Skill</option>';

        // Populate with new options
        skills.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill;
            option.textContent = skill;
            skillSelect.appendChild(option);
        });

        // FIX: Ensure placeholder is selected by index (0)
        skillSelect.selectedIndex = 0; 
    }

    // Attach listener to Job Domain dropdown
    jobDomainSelect.addEventListener('change', updateSkillOptions);

    // Initial call to ensure the skill dropdown is cleared/populated on load
    updateSkillOptions(); 
    
    // Function to create a new skill tag element
    function createSkillTag(skillName) {
        const skillText = skillName.trim();
        // Don't add if the text is empty or the default placeholder
        if (skillText === "" || skillText === "Select a Skill") return null;

        const span = document.createElement('span');
        span.className = 'bg-brand-accent text-brand-dark px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 transition duration-200 ease-in-out transform hover:scale-105';
        span.innerHTML = `${skillText} <i class="fas fa-times cursor-pointer hover:text-red-600 remove-skill" aria-label="Remove skill ${skillText}"></i>`;
        return span;
    }

    // Function to add a skill
    function addSkill() {
        const skillName = skillSelect.value.trim(); // Read value from the select element
        
        // 1. Check for placeholder (value is empty string)
        // If the placeholder is selected, reset the index and exit.
        if (skillName.length === 0) { 
            skillSelect.selectedIndex = 0;
            return; 
        }

        // 2. Check for duplicates
        const existingSkills = Array.from(skillTagsContainer.querySelectorAll('span')).map(s => s.textContent.split(' ')[0].trim().toLowerCase());
        
        if (existingSkills.includes(skillName.toLowerCase())) {
            // Reset selection using selectedIndex even if duplicate to allow re-selection later
            skillSelect.selectedIndex = 0; 
            return; 
        }

        // 3. Add skill
        const newTag = createSkillTag(skillName);
        if (newTag) {
            skillTagsContainer.appendChild(newTag);
        }
        
        // 4. CRITICAL FIX: Reset the select box using selectedIndex (0)
        // This is the key step that allows the change event to fire again 
        // when the same option is subsequently re-selected.
        skillSelect.selectedIndex = 0;
    }

    // Event listener for the Add button
    const addBtn = document.getElementById('addSkillBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addSkill);
    }
    
    // Event listener for selecting an option from the dropdown (also triggers addSkill)
    skillSelect.addEventListener('change', addSkill);

    // Event listener for removing a skill using event delegation on the container
    skillTagsContainer.addEventListener('click', (e) => {
        const removeIcon = e.target.closest('.remove-skill');
        if (removeIcon) {
            removeIcon.closest('span').remove();
        }
    });

    // Clear All button functionality: resets file inputs, file lists, domain and skills
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            // Clear all file inputs found on the page
            document.querySelectorAll('input[type="file"]').forEach(fi => { try { fi.value = ''; } catch(e) {} });

            // Clear all file list displays (there may be multiple with same id in markup)
            document.querySelectorAll('#fileList').forEach(fl => fl.innerHTML = '');

            // Reset job domain and skill dropdowns
            if (jobDomainSelect) jobDomainSelect.selectedIndex = 0;
            if (typeof updateSkillOptions === 'function') updateSkillOptions();
            if (skillSelect) skillSelect.selectedIndex = 0;

            // Remove any selected skill tags
            if (skillTagsContainer) skillTagsContainer.innerHTML = '';

            // Optionally move focus to top so user can start again
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}
// END: Skill Management Functionality

// === Resume Upload API Integration (POST + GET) ===
const RESUME_API_BASE = `${window.location.origin}/api/resumes/upload`;

async function uploadResumesForUser() {
  const userIdInput = document.getElementById("userIdInput");
  if (!userIdInput) return;

  const userId = userIdInput.value.trim();
  if (!userId) {
    alert("Please enter a valid User ID before uploading resumes.");
    return;
  }

  if (!resumeFileInput || !resumeFileInput.files.length) {
    alert("Please select at least one resume file to upload.");
    return;
  }

  const formData = new FormData();
  Array.from(resumeFileInput.files).forEach((file) => {
    formData.append("files", file);
  });

  const token = localStorage.getItem("jwtToken");

  try {
    const response = await fetch(`${RESUME_API_BASE}/${encodeURIComponent(userId)}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Upload failed");
    }

    await response.json().catch(() => null);
    alert("Resumes uploaded successfully.");
    resumeFileInput.value = "";
    if (resumeFileList) resumeFileList.innerHTML = "";

    // Refresh uploaded list
    fetchUploadedResumes();
  } catch (err) {
    console.error("Resume upload error:", err);
    alert("Failed to upload resumes: " + err.message);
  }
}

async function fetchUploadedResumes() {
  const userIdInput = document.getElementById("userIdInput");
  const container = document.getElementById("uploadedResumes");
  if (!userIdInput || !container) return;

  const userId = userIdInput.value.trim();
  if (!userId) {
    container.innerHTML =
      '<p class="text-sm text-gray-400">Enter a User ID and click "Load Uploaded Resumes".</p>';
    return;
  }

  const token = localStorage.getItem("jwtToken");

  container.innerHTML =
    '<p class="text-sm text-gray-400">Loading uploaded resumes...</p>';

  try {
    const response = await fetch(`${RESUME_API_BASE}/${encodeURIComponent(userId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Failed to fetch resumes");
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML =
        '<p class="text-sm text-gray-400">No resumes found for this user.</p>';
      return;
    }

    const list = document.createElement("div");
    list.className = "space-y-2";

    data.forEach((resume) => {
      const row = document.createElement("div");
      row.className =
        "flex justify-between items-center bg-brand-dark p-3 rounded-lg border border-gray-700";
      row.innerHTML = `
        <div class="text-xs md:text-sm text-gray-200">
          <div class="font-semibold">${resume.fileName || "Resume"}</div>
          <div class="text-gray-400">${resume.originalFileName || ""}</div>
        </div>
        <span class="text-[10px] md:text-xs text-brand-accent">Uploaded</span>
      `;
      list.appendChild(row);
    });

    container.innerHTML = "";
    container.appendChild(list);
  } catch (err) {
    console.error("Fetch resumes error:", err);
    container.innerHTML =
      '<p class="text-sm text-red-400">Error loading resumes. Please try again.</p>';
  }
}

// === Job Creation Form Handler ===
async function handleJobCreation(event) {
  event.preventDefault();
  
  const jobTitle = document.getElementById('jobTitle').value.trim();
  const jobDepartment = document.getElementById('jobDepartment').value.trim();
  const requiredSkills = document.getElementById('requiredSkills').value.trim();
  const preferredSkills = document.getElementById('preferredSkills').value.trim();
  const minExperience = document.getElementById('minExperience').value;
  const educationLevel = document.getElementById('educationLevel').value;
  const jobDescription = document.getElementById('jobDescription').value.trim();
  
  // Client-side validation
  if (!jobTitle) {
    alert('Job Title is required.');
    return;
  }
  
  if (!requiredSkills) {
    alert('At least one required skill must be provided.');
    return;
  }
  
  if (!minExperience || isNaN(minExperience) || parseFloat(minExperience) < 0) {
    alert('Please enter a valid minimum experience (number >= 0).');
    return;
  }
  
  // Get userId from input or localStorage
  const userIdInput = document.getElementById('userIdInput');
  const userId = userIdInput ? userIdInput.value.trim() : localStorage.getItem('userId');
  
  if (!userId) {
    alert('Please enter a User ID first.');
    return;
  }
  
  // Convert comma-separated skills to array
  const requiredSkillsArray = requiredSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const preferredSkillsArray = preferredSkills ? preferredSkills.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
  
  // Build request body matching JobPosting entity
  const requestBody = {
    title: jobTitle,
    department: jobDepartment || null,
    description: jobDescription || null,
    minExperienceYears: parseInt(minExperience),
    educationLevel: educationLevel || null
  };
  
  const token = localStorage.getItem('jwtToken');
  const API_BASE = `${window.location.origin}/api/job-postings/create`;
  
  try {
    const response = await fetch(`${API_BASE}?userId=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to create job posting');
    }
    
    const jobData = await response.json();
    
    // Store jobId and userId in localStorage
    if (jobData && jobData.id) {
      localStorage.setItem('jobId', jobData.id.toString());
      localStorage.setItem('userId', userId);
      
      alert('Job posting created successfully! Job ID: ' + jobData.id);
      
      // Redirect to Resume Upload section (scroll to it or stay on page)
      document.getElementById('resumeFileInput')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (error) {
    console.error('Job creation error:', error);
    alert('Failed to create job posting: ' + error.message);
  }
}

// === Analyze Candidates Handler ===
async function handleAnalyzeCandidates() {
  const jobId = localStorage.getItem('jobId');
  
  if (!jobId) {
    alert('Please create a job posting first before analyzing candidates.');
    return;
  }
  
  const token = localStorage.getItem('jwtToken');
  const SCORE_API_BASE = `${window.location.origin}/api/score`;
  
  try {
    // Trigger scoring
    const scoreResponse = await fetch(`${SCORE_API_BASE}/${encodeURIComponent(jobId)}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    if (!scoreResponse.ok) {
      const errorText = await scoreResponse.text();
      throw new Error(errorText || 'Failed to trigger scoring');
    }
    
    const scoreData = await scoreResponse.json();
    alert('Analysis started! ' + (scoreData.message || 'Scoring is running in the background.'));
    
    // Redirect to dashboard with jobId
    window.location.href = `dashboard.html?jobId=${encodeURIComponent(jobId)}`;
  } catch (error) {
    console.error('Analyze error:', error);
    alert('Failed to start analysis: ' + error.message);
  }
}

// Expose functions for buttons in HTML
window.uploadResumesForUser = uploadResumesForUser;
window.fetchUploadedResumes = fetchUploadedResumes;
window.handleJobCreation = handleJobCreation;
window.handleAnalyzeCandidates = handleAnalyzeCandidates;