// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const clearFilesBtn = document.getElementById('clearFiles');
const processFilesBtn = document.getElementById('processFiles');
const resultsSection = document.getElementById('resultsSection');
const candidateCardsContainer = document.getElementById('candidateCardsContainer');
const exportCsvBtn = document.getElementById('exportCsv');
const shortlistBtn = document.getElementById('shortlistCandidates');
const logoutBtn = document.getElementById('logoutBtn');

// State
let uploadedFiles = [];
let processedCandidates = [];
let selectedSkills = [];
let allSkills = [];
let currentJobRole = '';
let candidates = [];
let filteredCandidates = [];
let currentPage = 1;
const itemsPerPage = 8;
let processingTimeout = null;
let isProcessing = false;

// Available skills for the skills selector
const availableSkills = [
    'JavaScript', 'React', 'HTML', 'CSS', 'Node.js', 'Python', 'Java', 'SQL',
    'MongoDB', 'Express', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Git', 'REST API',
    'GraphQL', 'Redux', 'TypeScript', 'Angular', 'Vue.js', 'SASS', 'LESS', 'Bootstrap',
    'Tailwind CSS', 'jQuery', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring', '.NET',
    'C#', 'C++', 'Ruby', 'Ruby on Rails', 'Swift', 'Kotlin', 'Go', 'Rust', 'Machine Learning',
    'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI', 'Excel', 'R', 'TensorFlow',
    'PyTorch', 'NLP', 'Computer Vision', 'Deep Learning', 'Data Science', 'Big Data', 'Hadoop',
    'Spark', 'Kafka', 'Elasticsearch', 'Redis', 'PostgreSQL', 'MySQL', 'Oracle', 'MongoDB',
    'DynamoDB', 'Firebase', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Terraform', 'Ansible',
    'Linux', 'Bash', 'Shell Scripting', 'Agile', 'Scrum', 'Jira', 'Confluence', 'Figma',
    'Sketch', 'Adobe XD', 'UI/UX Design', 'Responsive Design', 'Mobile Development',
    'iOS', 'Android', 'React Native', 'Flutter', 'Ionic', 'WordPress', 'Shopify', 'Magento'
].sort();

// Sample job positions (in a real app, this would come from an API)
const jobPositions = [
    { id: 'frontend', name: 'Frontend Developer', skills: ['JavaScript', 'React', 'HTML', 'CSS'] },
    { id: 'backend', name: 'Backend Developer', skills: ['Node.js', 'Python', 'Java', 'SQL'] },
    { id: 'fullstack', name: 'Full Stack Developer', skills: ['JavaScript', 'Node.js', 'React', 'Express', 'MongoDB'] }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    init();
});

// Initialize the application
function init() {
    setupEventListeners();
    
    // Initialize the results section
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.style.display = 'none';
    }
    
    // Load any previously uploaded files
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
        uploadedFiles = JSON.parse(savedFiles);
        updateFileList();
    }
    
    // Initialize candidate data
    initializeCandidateData();
    
    // Initialize skills functionality
    initializeSkills();
    
    // Add event listeners for filters
    const searchInput = document.getElementById('candidateSearch');
    const matchScoreFilter = document.getElementById('matchScoreFilter');
    const statusFilter = document.getElementById('statusFilter');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterCandidates);
    }
    
    if (matchScoreFilter) {
        matchScoreFilter.addEventListener('change', filterCandidates);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCandidates);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
            }
        });
    }
}

// Set up event listeners
function setupEventListeners() {
    // File upload
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
        dropZone.addEventListener('click', () => fileInput.click());
    }
    
    // File input change
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect, false);
    }
    
    // Process files button
    if (processFilesBtn) {
        processFilesBtn.addEventListener('click', processFiles);
    }
    
    // Export to CSV button
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportToCsv);
    }
    
    // Shortlist button
    if (shortlistBtn) {
        shortlistBtn.addEventListener('click', shortlistCandidates);
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Button clicks
    if (clearFilesBtn) clearFilesBtn.addEventListener('click', clearFiles);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCsv);
    if (shortlistBtn) shortlistBtn.addEventListener('click', shortlistCandidates);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
}

// Initialize candidate data (mock data for now, replace with actual data from backend)
function initializeCandidateData() {
    // This would typically come from your backend
    candidates = [
        { name: 'John Doe', matchScore: 92, role: 'Senior Frontend Developer', experience: '5 years', location: 'New York', skills: ['React', 'TypeScript', 'Node.js', 'Redux'] },
        { name: 'Jane Smith', matchScore: 85, role: 'UX/UI Designer', experience: '4 years', location: 'San Francisco', skills: ['Figma', 'Sketch', 'Adobe XD', 'User Research'] },
        { name: 'Michael Johnson', matchScore: 78, role: 'Backend Developer', experience: '6 years', location: 'Chicago', skills: ['Python', 'Django', 'PostgreSQL', 'AWS'] },
        { name: 'Emily Davis', matchScore: 65, role: 'Full Stack Developer', experience: '3 years', location: 'Austin', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'] },
        { name: 'Robert Wilson', matchScore: 58, role: 'DevOps Engineer', experience: '5 years', location: 'Seattle', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'] },
        { name: 'Sarah Brown', matchScore: 45, role: 'Product Manager', experience: '7 years', location: 'Boston', skills: ['Agile', 'Scrum', 'Product Strategy', 'JIRA'] },
        { name: 'David Lee', matchScore: 82, role: 'Data Scientist', experience: '4 years', location: 'Remote', skills: ['Python', 'Machine Learning', 'Pandas', 'TensorFlow'] },
        { name: 'Amanda Clark', matchScore: 91, role: 'Frontend Engineer', experience: '3 years', location: 'Denver', skills: ['React', 'Vue.js', 'JavaScript', 'CSS3'] },
        { name: 'James Rodriguez', matchScore: 72, role: 'Backend Developer', experience: '5 years', location: 'Miami', skills: ['Java', 'Spring Boot', 'Microservices', 'Docker'] },
        { name: 'Jennifer Kim', matchScore: 88, role: 'UX Designer', experience: '4 years', location: 'Portland', skills: ['UI/UX', 'Prototyping', 'User Research', 'Figma'] },
        { name: 'Thomas Anderson', matchScore: 53, role: 'Full Stack Developer', experience: '2 years', location: 'Remote', skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'] },
        { name: 'Lisa Wong', matchScore: 79, role: 'Product Designer', experience: '5 years', location: 'Los Angeles', skills: ['UI/UX', 'User Research', 'Figma', 'Sketch'] }
    ];
    
    filteredCandidates = [...candidates];
    updatePagination();
}

// Function to generate a random color based on name
function getInitialsColor(name) {
    const colors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', 
        '#e74a3b', '#6f42c1', '#fd7e14', '#20c9a6'
    ];
    const index = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[index % colors.length];
}

// Function to get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Function to determine status category based on score
function getStatusCategory(score) {
    if (score >= 80) return 'shortlisted';
    if (score >= 50) return 'consider';
    return 'rejected';
}

// Function to format match score
function formatMatchScore(score) {
    return Math.round(score);
}

// Function to render candidate cards
function renderCandidateCards(candidatesToRender) {
    const container = document.getElementById('candidateCardsContainer');
    if (!container) return;

    if (candidatesToRender.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x mb-3"></i>
                <h3>No candidates found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = candidatesToRender.map(candidate => {
        const initials = getInitials(candidate.name);
        const statusCategory = getStatusCategory(candidate.matchScore);
        const formattedScore = formatMatchScore(candidate.matchScore);
        
        return `
            <div class="candidate-card">
                <div class="candidate-card-header">
                    <div class="candidate-info">
                        <div class="candidate-avatar" style="background-color: ${getInitialsColor(candidate.name)}20; color: ${getInitialsColor(candidate.name)};">
                            ${initials}
                        </div>
                        <div>
                            <div class="candidate-name">${candidate.name}</div>
                            <div class="candidate-role">${candidate.role || 'Software Engineer'}</div>
                        </div>
                    </div>
                    <div class="match-badge">
                        ${formattedScore}%
                        <span>Match</span>
                    </div>
                </div>
                
                <div class="candidate-meta">
                    <div><strong>Experience:</strong> ${candidate.experience || 'N/A'}</div>
                    <div><strong>Location:</strong> ${candidate.location || 'Remote'}</div>
                    <div><strong>Skills:</strong> ${candidate.skills?.slice(0, 3).join(', ') || 'N/A'}</div>
                </div>
                
                <div class="candidate-card-footer">
                    <span class="status-pill status-${statusCategory}">
                        ${statusCategory.charAt(0).toUpperCase() + statusCategory.slice(1)}
                    </span>
                    <div class="card-actions">
                        <i class="far fa-eye" title="View Resume"></i>
                        <i class="far fa-download" title="Download"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Function to filter candidates based on search and filters
function filterCandidates() {
    const searchTerm = document.getElementById('candidateSearch').value.toLowerCase();
    const matchScoreFilter = document.getElementById('matchScoreFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredCandidates = candidates.filter(candidate => {
        // Search filter
        const matchesSearch = !searchTerm || 
            candidate.name.toLowerCase().includes(searchTerm) ||
            (candidate.role && candidate.role.toLowerCase().includes(searchTerm)) ||
            (candidate.skills && candidate.skills.some(skill => 
                skill.toLowerCase().includes(searchTerm)
            ));

        // Match score filter
        let matchesScore = true;
        if (matchScoreFilter !== 'all') {
            const [min, max] = matchScoreFilter === 'below-60' 
                ? [0, 60] 
                : matchScoreFilter.split('-').map(Number);
            
            const score = formatMatchScore(candidate.matchScore);
            matchesScore = score >= min && score <= (max || 100);
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            const statusCategory = getStatusCategory(candidate.matchScore);
            matchesStatus = statusCategory === statusFilter;
        }

        return matchesSearch && matchesScore && matchesStatus;
    });

    // Reset to first page when filters change
    currentPage = 1;
    updatePagination();
    renderPagination();
}

// Function to update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedCandidates = filteredCandidates.slice(startIdx, endIdx);
    
    renderCandidateCards(paginatedCandidates);
    
    // Update pagination buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// Function to render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
    const paginationBar = document.querySelector('.pagination-bar');
    
    if (!paginationBar) return;
    
    // Previous button is already in HTML, just update its disabled state
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}

// Prevent default drag and drop behavior
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Highlight drop zone when dragging files over it
function highlight() {
    dropZone.style.borderColor = '#4a6cf7';
    dropZone.style.backgroundColor = 'rgba(74, 108, 247, 0.1)';
}

// Remove highlight when leaving drop zone
function unhighlight() {
    dropZone.style.borderColor = '#ddd';
    dropZone.style.backgroundColor = 'transparent';
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle file selection via file input
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// Process selected files
function handleFiles(files) {
    if (!files || files.length === 0) return;
    
    // Convert FileList to array and add to uploadedFiles
    Array.from(files).forEach(file => {
        // Check if file already exists
        const fileExists = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
        
        // Check file type
        const fileType = file.name.split('.').pop().toLowerCase();
        const allowedTypes = ['pdf', 'doc', 'docx'];
        
        if (!allowedTypes.includes(fileType)) {
            alert(`Unsupported file type: ${file.name}. Please upload PDF, DOC, or DOCX files.`);
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(`File too large: ${file.name}. Maximum file size is 10MB.`);
            return;
        }
        
        // Add file if it doesn't exist and we haven't reached the limit
        if (!fileExists && uploadedFiles.length < 20) {
            uploadedFiles.push(file);
        } else if (uploadedFiles.length >= 20) {
            alert('Maximum of 20 files allowed. Please remove some files before adding more.');
        }
    });
    
    // Update the file list display
    updateFileList();
    
    // Save to localStorage (in a real app, this would be an API call)
    saveFiles();
}

// Update the file list display
function updateFileList() {
    fileList.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
        fileList.innerHTML = '<p>No files uploaded yet.</p>';
        return;
    }
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-alt"></i>
                <span>${file.name} (${formatFileSize(file.size)})</span>
            </div>
            <div class="file-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </div>
        `;
        fileList.appendChild(fileItem);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.file-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.getAttribute('data-index'));
            removeFile(index);
        });
    });
}

// Remove a file from the list
function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updateFileList();
    saveFiles();
}

// Clear all files and stop any ongoing processing
function clearFiles() {
    if (confirm('Are you sure you want to remove all files? This will stop any ongoing processing.')) {
        // Clear any ongoing processing
        if (isProcessing && processingTimeout) {
            clearTimeout(processingTimeout);
            isProcessing = false;
            
            // Reset process button state
            if (processFilesBtn) {
                processFilesBtn.disabled = false;
                processFilesBtn.textContent = 'Process Resumes';
            }
        }
        
        // Clear files and update UI
        uploadedFiles = [];
        processedCandidates = [];
        updateFileList();
        saveFiles();
        
        // Hide results section if visible
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }
}

// Save files to localStorage (in a real app, this would be an API call)
function saveFiles() {
    // In a real app, you would upload files to a server here
    // For this demo, we'll just save to localStorage
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
}

// Process the uploaded resumes
function processFiles() {
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one resume before processing.');
        return;
    }
    
    // Show loading state
    isProcessing = true;
    processFilesBtn.disabled = true;
    processFilesBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing Resumes...';
    
    // Simulate API call with timeout (in a real app, this would be an actual API call)
    processingTimeout = setTimeout(() => {
        if (!isProcessing) return; // Don't proceed if processing was cancelled
        
        // Common job positions for variety
        const jobPositions = [
            'Frontend Developer', 
            'Backend Developer', 
            'Full Stack Developer',
            'DevOps Engineer',
            'UI/UX Designer',
            'Data Scientist',
            'Machine Learning Engineer',
            'Mobile App Developer',
            'QA Engineer',
            'Product Manager'
        ];
        
        // Generate mock processed data
        processedCandidates = uploadedFiles.map((file, index) => {
            // Generate a random score between 40 and 100 for variety
            const score = Math.floor(40 + Math.random() * 61);
            
            // Determine status based on score
            let status;
            if (score >= 80) status = 'Eligible';
            else if (score >= 60) status = 'Consider';
            else status = 'Not Eligible';
            
            // Generate a more realistic name and email
            const nameParts = file.name.split('.').shift().split(/[-_\s]+/);
            const formattedName = nameParts.map(part => 
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ');
            
            const firstName = nameParts[0].toLowerCase();
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : 'user';
            const email = `${firstName}.${lastName}@example.com`;
            
            return {
                id: `candidate-${Date.now()}-${index}`,
                name: formattedName,
                email: email,
                position: jobPositions[Math.floor(Math.random() * jobPositions.length)],
                score: score,
                status: status,
                file: file
            };
        });
        
        // Sort by score (highest first)
        processedCandidates.sort((a, b) => b.score - a.score);
        
        // Update the results table
        updateResultsTable();
        
        // Show the results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Reset button state
        isProcessing = false;
        processFilesBtn.disabled = false;
        processFilesBtn.textContent = 'Process Resumes';
    }, 2000);
}

// Update the results table with candidate data
function updateResultsTable() {
    const resultsTableBody = document.getElementById('resultsTableBody');
    resultsTableBody.innerHTML = '';
    
    if (processedCandidates.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" style="text-align: center; padding: 30px; color: #6b7280;">No candidates to display. Please upload and process some resumes.</td>';
        resultsTableBody.appendChild(row);
        return;
    }
    
    processedCandidates.forEach((candidate, index) => {
        const row = document.createElement('tr');
        const statusClass = candidate.status.toLowerCase().replace(' ', '-');
        
        row.innerHTML = `
            <td style="font-weight: 500; color: #4b5563;">${index + 1}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0e7ff; color: #4a6cf7; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                        ${candidate.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                    <div>
                        <div style="font-weight: 500; color: #111827;">${candidate.name}</div>
                        <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">${candidate.email}</div>
                    </div>
                </div>
            </td>
            <td style="color: #4b5563;">${candidate.email}</td>
            <td style="color: #4b5563;">${candidate.position}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${candidate.score}%; height: 100%; background: #4a6cf7; border-radius: 3px;"></div>
                    </div>
                    <span style="font-weight: 600; color: #111827; min-width: 40px; text-align: right;">${candidate.score}%</span>
                </div>
            </td>
            <td>
                <span class="status-badge status-${statusClass}">
                    ${candidate.status}
                </span>
            </td>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button class="btn-view" data-id="${candidate.id}">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <div class="checkbox-container">
                        <input type="checkbox" class="candidate-checkbox" id="select-${candidate.id}" data-id="${candidate.id}">
                        <label for="select-${candidate.id}" style="cursor: pointer;"></label>
                    </div>
                </div>
            </td>
        `;
        
        resultsTableBody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-resume').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const candidateId = e.currentTarget.getAttribute('data-id');
            viewResume(candidateId);
        });
    });
}

 

// View a candidate's resume
function viewResume(candidateId) {
    const candidate = processedCandidates.find(c => c.id === candidateId);
    if (!candidate) return;
    
    // In a real app, this would open the actual resume file
    // For this demo, we'll just show an alert with the candidate's details
    alert(`Viewing resume for: ${candidate.name}\n\n` +
          `Email: ${candidate.email}\n` +
          `Position: ${candidate.position}\n` +
          `Skills: ${candidate.skills}\n` +
          `Score: ${candidate.score}%\n` +
          `Status: ${candidate.status}`);
}

// Export results to CSV
function exportToCsv() {
    if (processedCandidates.length === 0) {
        alert('No data to export.');
        return;
    }
    
    // Get visible rows (after filtering)
    const visibleRows = Array.from(resultsTableBody.querySelectorAll('tr'))
        .filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No visible data to export with current filters.');
        return;
    }
    
    // Get headers
    const headers = ['#', 'Name', 'Email', 'Position', 'Score', 'Status'];
    
    // Get data rows
    const rows = [];
    visibleRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        const rowData = [
            index + 1,
            cells[1].textContent,
            cells[2].textContent,
            cells[3].textContent,
            cells[4].textContent,
            cells[5].textContent.trim()
        ];
        rows.push(rowData.join(','));
    });
    
    // Combine headers and rows
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `candidates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Shortlist selected candidates
function shortlistCandidates() {
    const selectedCheckboxes = document.querySelectorAll('.candidate-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one candidate to shortlist.');
        return;
    }
    
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-id'));
    const selectedCandidates = processedCandidates.filter(candidate => 
        selectedIds.includes(candidate.id)
    );
    
    // In a real app, this would be an API call to save the shortlisted candidates
    console.log('Shortlisted candidates:', selectedCandidates);
    
    alert(`Successfully shortlisted ${selectedCandidates.length} candidate(s).`);
}

// Handle logout
function handleLogout() {
    // In a real app, this would clear the session and redirect to login
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored data
        localStorage.removeItem('uploadedFiles');
        
        // Redirect to login page (in a real app)
        window.location.href = 'index.html';
    }
}

// Initialize skills functionality
function initializeSkills() {
    const addSkillBtn = document.getElementById('addSkillBtn');
    const skillsDropdown = document.getElementById('skillsDropdown');
    const skillSearch = document.getElementById('skillSearch');
    const skillsList = document.getElementById('skillsList');
    const selectedSkillsContainer = document.getElementById('selectedSkills');
    const skillCounter = document.getElementById('skillCounter');
    const jobRoleSelect = document.getElementById('jobRole');

    // Toggle skills dropdown
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle dropdown visibility
            const isShowing = skillsDropdown.classList.toggle('show');
            
            // If dropdown is now visible, focus the search input
            if (isShowing && skillSearch) {
                // Small timeout to ensure the dropdown is visible before focusing
                setTimeout(() => {
                    skillSearch.focus();
                    // Clear any previous search
                    skillSearch.value = '';
                    renderSkillsList();
                }, 10);
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.skills-container')) {
            skillsDropdown.classList.remove('show');
        }
    });

    // Filter skills based on search input
    if (skillSearch) {
        skillSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredSkills = availableSkills.filter(skill => 
                skill.toLowerCase().includes(searchTerm)
            );
            renderSkillsList(filteredSkills);
        });
    }

    // Render skills list
    function renderSkillsList(skills = availableSkills) {
        if (!skillsList) return;
        
        skillsList.innerHTML = skills.map(skill => {
            const isSelected = selectedSkills.includes(skill);
            return `
                <div class="skill-item ${isSelected ? 'selected' : ''}" data-skill="${skill}">
                    ${skill}
                    ${isSelected ? '<i class="fas fa-check"></i>' : ''}
                </div>
            `;
        }).join('');

        // Add event listeners to skill items
        document.querySelectorAll('.skill-item').forEach(item => {
            item.addEventListener('click', () => {
                const skill = item.getAttribute('data-skill');
                toggleSkill(skill);
            });
        });
    }

    // Toggle skill selection
    function toggleSkill(skill) {
        const index = selectedSkills.indexOf(skill);
        if (index === -1) {
            if (selectedSkills.length < 10) {
                selectedSkills.push(skill);
            }
        } else {
            selectedSkills.splice(index, 1);
        }
        updateSelectedSkills();
        renderSkillsList();
    }

    // Update selected skills display
    function updateSelectedSkills() {
        if (!selectedSkillsContainer) return;
        
        selectedSkillsContainer.innerHTML = selectedSkills.map(skill => `
            <div class="skill-tag">
                ${skill}
                <span class="remove-skill" data-skill="${skill}">&times;</span>
            </div>
        `).join('');

        // Update skill counter
        if (skillCounter) {
            skillCounter.textContent = selectedSkills.length;
        }

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-skill').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const skill = btn.getAttribute('data-skill');
                const index = selectedSkills.indexOf(skill);
                if (index !== -1) {
                    selectedSkills.splice(index, 1);
                    updateSelectedSkills();
                    renderSkillsList();
                }
            });
        });
    }

    // Initialize skills list
    renderSkillsList();

    // Handle job role change
    if (jobRoleSelect) {
        jobRoleSelect.addEventListener('change', (e) => {
            const selectedRole = jobPositions.find(role => role.id === e.target.value);
            if (selectedRole) {
                selectedSkills = [...new Set([...selectedSkills, ...selectedRole.skills])].slice(0, 10);
                updateSelectedSkills();
                renderSkillsList();
            }
        });
    }
}

// Helper function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
