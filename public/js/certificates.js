// DOM elements
const certificatesContent = document.getElementById('certificates-content');
const certificateForm = document.getElementById('certificate-form');
const addCertificateBtn = document.getElementById('add-certificate-btn');
const cancelCertificateBtn = document.getElementById('cancel-certificate');
const addCertificateFormEl = document.getElementById('add-certificate-form');
const certificatesContainer = document.getElementById('certificates-container');
const noCertificates = document.getElementById('no-certificates');
const transactionStatus = document.getElementById('transaction-status');

// Modal elements
const certificateModal = document.getElementById('certificate-modal');
const modalCertificateName = document.getElementById('modal-certificate-name');
const modalCertificateIssuer = document.getElementById('modal-certificate-issuer');
const modalCertificateDate = document.getElementById('modal-certificate-date');
const modalCertificateImage = document.getElementById('modal-certificate-image');
const modalCertificateVerification = document.getElementById('modal-certificate-verification');

// Load user certificates from blockchain
async function loadUserCertificates() {
    try {
        // Show appropriate UI elements
        certificatesContent.classList.remove('d-none');
        certificateForm.classList.add('d-none');
        
        // Clear existing certificates
        certificatesContainer.innerHTML = '';
        
        // Get certificate count
        const count = await ePortfolioContract.getCertificateCount(userAddress);
        const certificateCount = count.toNumber();
        
        if (certificateCount === 0) {
            // No certificates found
            noCertificates.classList.remove('d-none');
            return;
        }
        
        // Hide no certificates message
        noCertificates.classList.add('d-none');
        
        // Load each certificate
        for (let i = 0; i < certificateCount; i++) {
            const certificate = await ePortfolioContract.getCertificate(userAddress, i);
            
            // Create certificate card
            const certificateCard = createCertificateCard(certificate, i);
            certificatesContainer.appendChild(certificateCard);
        }
    } catch (error) {
        console.error('Error loading certificates:', error);
        showError('Failed to load certificates from blockchain. Please try again.');
    }
}

// Create certificate card element
function createCertificateCard(certificate, index) {
    const [name, issuer, date, cid, verified] = certificate;
    
    // Create card element
    const cardCol = document.createElement('div');
    cardCol.className = 'col-md-6 mb-4';
    
    cardCol.innerHTML = `
        <div class="card h-100">
            <div class="card-body">
                <h5 class="card-title">${name}</h5>
                <p class="card-text"><strong>Issuer:</strong> ${issuer}</p>
                <p class="card-text"><strong>Date:</strong> ${formatDate(date)}</p>
                <div class="d-grid">
                    <button class="btn btn-primary view-certificate" data-index="${index}">View Certificate</button>
                </div>
            </div>
            <div class="card-footer">
                <small class="text-muted">
                    <span class="badge bg-success">Verified on Blockchain</span>
                </small>
            </div>
        </div>
    `;
    
    // Add event listener to view button
    const viewButton = cardCol.querySelector('.view-certificate');
    viewButton.addEventListener('click', () => {
        viewCertificate(certificate);
    });
    
    return cardCol;
}

// View certificate details in modal
function viewCertificate(certificate) {
    const [name, issuer, date, cid, verified] = certificate;
    
    // Set modal content
    modalCertificateName.textContent = name;
    modalCertificateIssuer.textContent = issuer;
    modalCertificateDate.textContent = formatDate(date);
    
    // In a real app, you would fetch from IPFS using the CID
    // For this demo, we'll use a placeholder
    modalCertificateImage.src = '/uploads/' + cid || '/img/certificate-placeholder.png';
    
    // Show verification status
    if (verified) {
        modalCertificateVerification.className = 'badge bg-success';
        modalCertificateVerification.textContent = 'Verified on Blockchain';
    } else {
        modalCertificateVerification.className = 'badge bg-warning';
        modalCertificateVerification.textContent = 'Pending Verification';
    }
    
    // Show modal
    const modal = new bootstrap.Modal(certificateModal);
    modal.show();
}

// Add certificate to blockchain
async function addCertificate(event) {
    event.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(addCertificateFormEl);
        
        // Show transaction status
        transactionStatus.classList.remove('d-none');
        
        // First, upload the certificate data to the server
        const response = await fetch('/api/upload-certificate', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload certificate data');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to process certificate data');
        }
        
        // Now add the certificate to the blockchain
        const tx = await ePortfolioContract.addCertificate(
            result.data.name,
            result.data.issuer,
            result.data.date,
            result.data.cid
        );
        
        // Wait for transaction to be mined
        await tx.wait();
        
        // Hide transaction status
        transactionStatus.classList.add('d-none');
        
        // Show success message
        showSuccess('Certificate added successfully!');
        
        // Reset form and hide it
        addCertificateFormEl.reset();
        certificateForm.classList.add('d-none');
        
        // Reload certificates
        loadUserCertificates();
    } catch (error) {
        console.error('Error adding certificate:', error);
        showError('Failed to add certificate to blockchain. Please try again.');
        
        // Hide transaction status
        transactionStatus.classList.add('d-none');
    }
}

// Setup event listeners
function setupCertificatesEventListeners() {
    // Add certificate button
    if (addCertificateBtn) {
        addCertificateBtn.addEventListener('click', () => {
            certificateForm.classList.remove('d-none');
        });
    }
    
    // Cancel certificate button
    if (cancelCertificateBtn) {
        cancelCertificateBtn.addEventListener('click', () => {
            certificateForm.classList.add('d-none');
            addCertificateFormEl.reset();
        });
    }
    
    // Certificate form submission
    if (addCertificateFormEl) {
        addCertificateFormEl.addEventListener('submit', addCertificate);
    }
}

// Initialize certificates page
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners specific to certificates page
    setupCertificatesEventListeners();
});
