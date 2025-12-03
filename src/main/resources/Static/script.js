// Shared JavaScript functions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Handle file upload drag and drop
    const dropzones = document.querySelectorAll('.upload-dropzone');
    if (dropzones) {
        dropzones.forEach(dropzone => {
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('active');
            });
            
            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('active');
            });
            
            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('active');
                const files = e.dataTransfer.files;
                handleFiles(files);
            });
        });
    }
    
    // File input change handler
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
    });
});

function handleFiles(files) {
    console.log('Files to upload:', files);
    // Here you would typically handle the file upload process
    // For demo purposes, we'll just show a notification
    showNotification(`${files.length} file(s) selected for upload`, 'success');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Shared utility functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function calculateMatchPercentage(requiredSkills, candidateSkills) {
    if (!requiredSkills || requiredSkills.length === 0) return 0;
    const matchedSkills = candidateSkills.filter(skill => 
        requiredSkills.includes(skill)
    ).length;
    return Math.round((matchedSkills / requiredSkills.length) * 100);
}