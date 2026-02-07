feather.replace();

// ===== Modal Logic (For Score Analysis) =====
const scoreModal = document.getElementById('scoreModal'); 
const scoreModalContent = document.getElementById('scoreModalContent');

function openScoreModal(candidate) {
    if(!scoreModal || !scoreModalContent) return;

    // Populate Header
    document.getElementById('modalCandidateName').textContent = candidate.candidateName || "Candidate";
    document.getElementById('modalTotalScore').textContent = candidate.totalScore || 0;
    
    // Clear Table
    const tbody = document.getElementById('scoreTableBody');
    tbody.innerHTML = ''; 

    // Render Rows from Backend Data
    if (candidate.breakdown && candidate.breakdown.length > 0) {
        candidate.breakdown.forEach(item => {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-800 last:border-0 hover:bg-white/5 transition-colors";
            
            // Generate Feedback Text
            // If the score is perfect, show Green text. If not, show advice.
            const feedbackColor = item.score === item.maxScore ? "text-green-400" : "text-yellow-400";
            
            row.innerHTML = `
                <td class="py-3 font-medium text-white">${item.category}</td>
                <td class="py-3 text-xs ${feedbackColor}">${item.feedback || '-'}</td>
                <td class="py-3 text-right font-bold ${getScoreColorClass(item.score, item.maxScore)}">
                    ${item.score} <span class="text-gray-600 font-normal">/ ${item.maxScore}</span>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-500">No detailed breakdown available.</td></tr>';
    }

    // Animation
    scoreModal.classList.remove('hidden');
    setTimeout(() => {
        scoreModal.classList.remove('opacity-0');
        scoreModalContent.classList.remove('scale-95');
        scoreModalContent.classList.add('scale-100');
    }, 10);
}

function closeScoreModal() {
    if(!scoreModal || !scoreModalContent) return;
    scoreModal.classList.add('opacity-0');
    scoreModalContent.classList.remove('scale-100');
    scoreModalContent.classList.add('scale-95');
    setTimeout(() => { scoreModal.classList.add('hidden'); }, 300);
}

function getScoreColorClass(score, max) {
    const percentage = score / max;
    if (percentage >= 0.8) return "text-green-400";
    if (percentage >= 0.5) return "text-yellow-400";
    return "text-red-400";
}

// ===== Dashboard Core =====
let rawCandidates = [];
const candidateList = document.getElementById('candidateList');
const noResults = document.getElementById('noResults');
const cardTemplate = document.getElementById('cardTemplate');

function getScoreColor(score) {
    if (!score) return 'bg-gray-600 text-white';
    if (score >= 75) return 'bg-green-500 text-white';
    if (score >= 50) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
}

function formatStatus(status) {
    if (!status) return 'Pending';
    const s = status.toUpperCase();
    return s === 'SHORTLISTED' ? 'Shortlisted' : s === 'REJECTED' ? 'Rejected' : 'Pending';
}

function renderCandidates() {
    if (!candidateList || !cardTemplate) return;
    candidateList.innerHTML = '';
    
    if (rawCandidates.length === 0) {
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    if (noResults) noResults.classList.add('hidden');

    const searchInput = document.getElementById('searchInput');
    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const checkedStatuses = Array.from(document.querySelectorAll('input[name="statusFilter"]:checked')).map(cb => cb.value.toUpperCase());

    const filtered = rawCandidates.filter(c => {
        if (search && !(c.candidateName || '').toLowerCase().includes(search)) return false;
        if (checkedStatuses.length > 0) {
            const status = (c.status || 'PENDING').toUpperCase();
            if (!checkedStatuses.includes(status)) return false;
        }
        return true;
    });

    filtered.forEach(candidate => {
        const clone = cardTemplate.content.cloneNode(true);
        
        const nameEl = clone.querySelector('.name');
        if(nameEl) nameEl.textContent = candidate.candidateName || 'Unknown';

        const jobDept = localStorage.getItem('activeJobDept') || 'Position Not Specified';
        const posEl = clone.querySelector('.position');
        if(posEl) posEl.textContent = jobDept;

        const scorePill = clone.querySelector('.score-pill');
        if (scorePill) {
            scorePill.textContent = candidate.totalScore ?? '—';
            scorePill.className = `score-pill px-4 py-1.5 rounded-full font-bold text-sm shadow-md ${getScoreColor(candidate.totalScore)}`;
        }

        const statusEl = clone.querySelector('.status-text');
        if (statusEl) {
            const statusText = formatStatus(candidate.status);
            const statusColor = candidate.status === 'SHORTLISTED' ? 'text-green-400' :
                               candidate.status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400';
            statusEl.textContent = statusText;
            statusEl.className = `status-text text-sm font-semibold ${statusColor}`;
        }

        // === INJECT ANALYSIS BUTTON ===
        const actionDiv = clone.querySelector('.actions'); 
        if (actionDiv) {
            const viewBtn = document.createElement('button');
            viewBtn.className = "text-xs bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-3 py-1 rounded-lg transition-colors ml-auto flex items-center";
            viewBtn.innerHTML = '<i data-feather="bar-chart-2" class="w-3 h-3 mr-1"></i> Analysis';
            // Pass the FULL candidate object (which contains the breakdown list)
            viewBtn.onclick = () => openScoreModal(candidate);
            actionDiv.appendChild(viewBtn);
        }

        candidateList.appendChild(clone);
    });
    
    if(typeof feather !== 'undefined') feather.replace();
}


// Single, Consolidated Load Function
async function loadDashboardStats() {
    const jobId = localStorage.getItem('activeJobId');
    const token = localStorage.getItem('jwtToken');
    if (!jobId) { console.warn("No active job found."); return; }

    ['totalCount', 'shortlistCount', 'avgScore'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
    });

    try {
        const baseUrl = CONFIG.API_BASE_URL.replace('/auth', '');
        const response = await fetch(`${baseUrl}/dashboard/${jobId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("API Error: " + response.status);

        const data = await response.json();
        rawCandidates = data;

        const total = data.length;
        const shortlisted = data.filter(c => c.status && c.status.toUpperCase() === 'SHORTLISTED').length;
        const valid = data.filter(c => c.totalScore != null);
        const avg = valid.length ? (valid.reduce((s, c) => s + c.totalScore, 0) / valid.length).toFixed(1) : '0.0';

        document.getElementById('totalCount').textContent = total;
        document.getElementById('shortlistCount').textContent = shortlisted;
        document.getElementById('avgScore').textContent = avg;

        renderCandidates();
    } catch (e) {
        console.error("Dashboard Load Error:", e);
        document.getElementById('totalCount').textContent = '-';
    }
}

async function confirmClearData() {
    if (!confirm("⚠️ WARNING: This will permanently delete ALL Jobs, Resumes, and Scores.\n\nAre you sure?")) {
        return;
    }

    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwtToken');

    if (!userId || !token) {
        alert("Error: User ID not found. Please log in again.");
        return;
    }

    try {
        const baseUrl = CONFIG.API_BASE_URL.replace('/auth', '');
        const deleteUrl = `${baseUrl}/cleanup/user-data/${userId}`;
        console.log("Attempting to delete data at:", deleteUrl);

        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert("✅ Database Flushed Successfully!");
            window.location.reload();
        } else {
            const errorText = await response.text();
            alert("Failed to clear data: " + errorText);
        }
    } catch (e) {
        console.error("Network Error:", e);
        alert("Network Error: Could not connect to server.");
    }
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();

    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (rawCandidates.length === 0) return alert("No data to export");
            const jobDept = localStorage.getItem('activeJobDept') || 'Position Not Specified';
            const headers = ["S.NO", "Name", "Position", "Total Score", "email" ,"Status"];
            const rows = rawCandidates.map((c, index) => [
                index + 1,
                c.candidateName || 'Unknown',
                jobDept,
                c.totalScore || '',
                c.email || '',
                formatStatus(c.status)
            ]);
            let csv = headers.join(",") + "\n" + rows.map(r => r.map(f => `"${f}"`).join(",")).join("\n");
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `candidates_${new Date().toISOString().slice(0,10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', renderCandidates);
    
    const filterSidebar = document.getElementById('filterSidebar');
    if (filterSidebar) filterSidebar.addEventListener('change', renderCandidates);
});