// DOM elements
const profileForm = document.getElementById('update-profile-form');
const profileView = document.getElementById('profile-view');
const profileFormContainer = document.getElementById('profile-form');
const editProfileBtn = document.getElementById('edit-profile');
const transactionStatus = document.getElementById('transaction-status');

// Profile data elements
const profileName = document.getElementById('profile-name');
const profileTitle = document.getElementById('profile-title');
const profileEmail = document.getElementById('profile-email');
const profilePhone = document.getElementById('profile-phone');
const profileLocation = document.getElementById('profile-location');
const profileBio = document.getElementById('profile-bio');
const profileSkillsContainer = document.getElementById('profile-skills-container');
const profileExperience = document.getElementById('profile-experience');
const profileEducation = document.getElementById('profile-education');
const profileLinkedinContainer = document.getElementById('profile-linkedin-container');
const profileGithubContainer = document.getElementById('profile-github-container');
const profileWebsiteContainer = document.getElementById('profile-website-container');
const profileLinkedin = document.getElementById('profile-linkedin');
const profileGithub = document.getElementById('profile-github');
const profileWebsite = document.getElementById('profile-website');

// Form elements
const nameInput = document.getElementById('name');
const titleInput = document.getElementById('title');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const locationInput = document.getElementById('location');
const bioInput = document.getElementById('bio');
const skillsInput = document.getElementById('skills');
const educationInput = document.getElementById('education');
const experienceInput = document.getElementById('experience');
const linkedinUrlInput = document.getElementById('linkedinUrl');
const githubUrlInput = document.getElementById('githubUrl');
const websiteUrlInput = document.getElementById('websiteUrl');

// Load user profile from blockchain
async function loadUserProfile() {
    try {
        // Show appropriate UI elements
        profileFormContainer.classList.add('d-none');
        profileView.classList.add('d-none');
        
        // Check if user has a profile
        const profileExists = await ePortfolioContract.userProfileExists(userAddress);
        
        if (profileExists) {
            // User has a profile, load all profile data
            const basicInfo = await ePortfolioContract.getUserBasicInfo(userAddress);
            const professionalInfo = await ePortfolioContract.getUserProfessionalInfo(userAddress);
            const socialInfo = await ePortfolioContract.getUserSocialInfo(userAddress);
            
            // Display basic info
            profileName.textContent = basicInfo.name;
            profileTitle.textContent = basicInfo.title || 'Professional';
            profileEmail.textContent = basicInfo.email;
            profilePhone.textContent = basicInfo.phone || 'Not provided';
            profileLocation.textContent = basicInfo.location || 'Not provided';
            profileBio.textContent = basicInfo.bio || 'No professional summary provided';
            
            // Display skills as badges
            if (professionalInfo.skills && professionalInfo.skills.trim() !== '') {
                const skills = professionalInfo.skills.split(',').map(skill => skill.trim());
                profileSkillsContainer.innerHTML = skills.map(skill => 
                    `<span class="badge bg-primary me-2 mb-2">${skill}</span>`
                ).join('');
            } else {
                profileSkillsContainer.innerHTML = '<p class="text-muted">No skills listed</p>';
            }
            
            // Display experience
            profileExperience.innerHTML = professionalInfo.experience ? 
                `<p>${professionalInfo.experience.replace(/\n/g, '<br>')}</p>` : 
                '<p class="text-muted">No work experience listed</p>';
            
            // Display education
            profileEducation.innerHTML = professionalInfo.education ? 
                `<p>${professionalInfo.education.replace(/\n/g, '<br>')}</p>` : 
                '<p class="text-muted">No education listed</p>';
            
            // Handle social links
            if (socialInfo.linkedinUrl && socialInfo.linkedinUrl.trim() !== '') {
                profileLinkedinContainer.classList.remove('d-none');
                profileLinkedin.href = socialInfo.linkedinUrl;
                profileLinkedin.textContent = socialInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '');
            } else {
                profileLinkedinContainer.classList.add('d-none');
            }
            
            if (socialInfo.githubUrl && socialInfo.githubUrl.trim() !== '') {
                profileGithubContainer.classList.remove('d-none');
                profileGithub.href = socialInfo.githubUrl;
                profileGithub.textContent = socialInfo.githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, '');
            } else {
                profileGithubContainer.classList.add('d-none');
            }
            
            if (socialInfo.websiteUrl && socialInfo.websiteUrl.trim() !== '') {
                profileWebsiteContainer.classList.remove('d-none');
                profileWebsite.href = socialInfo.websiteUrl;
                profileWebsite.textContent = socialInfo.websiteUrl.replace(/^https?:\/\/(www\.)?/, '');
            } else {
                profileWebsiteContainer.classList.add('d-none');
            }
            
            // Show profile view
            profileView.classList.remove('d-none');
            
            // Also populate the form for editing
            nameInput.value = basicInfo.name;
            titleInput.value = basicInfo.title || '';
            emailInput.value = basicInfo.email;
            phoneInput.value = basicInfo.phone || '';
            locationInput.value = basicInfo.location || '';
            bioInput.value = basicInfo.bio || '';
            skillsInput.value = professionalInfo.skills || '';
            educationInput.value = professionalInfo.education || '';
            experienceInput.value = professionalInfo.experience || '';
            linkedinUrlInput.value = socialInfo.linkedinUrl || '';
            githubUrlInput.value = socialInfo.githubUrl || '';
            websiteUrlInput.value = socialInfo.websiteUrl || '';
        } else {
            // User doesn't have a profile, show form
            profileFormContainer.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load portfolio from blockchain. Please try again.');
        
        // Show form as fallback
        profileFormContainer.classList.remove('d-none');
    }
}

// Save profile to blockchain
async function saveProfile(event) {
    event.preventDefault();
    
    try {
        // Get form data
        const formData = new FormData(profileForm);
        
        // Show transaction status
        transactionStatus.classList.remove('d-none');
        
        // First, upload the profile data to the server
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Failed to upload profile data');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to process profile data');
        }
        
        // Now update the blockchain with the profile data in multiple transactions
        
        // 1. Basic Info
        let tx = await ePortfolioContract.setUserBasicInfo(
            result.data.name,
            result.data.title || '',
            result.data.email,
            result.data.phone || '',
            result.data.location || '',
            result.data.bio || ''
        );
        await tx.wait();
        
        // 2. Professional Info
        tx = await ePortfolioContract.setUserProfessionalInfo(
            result.data.skills || '',
            result.data.education || '',
            result.data.experience || ''
        );
        await tx.wait();
        
        // 3. Social Info
        tx = await ePortfolioContract.setUserSocialInfo(
            result.data.linkedinUrl || '',
            result.data.githubUrl || '',
            result.data.websiteUrl || '',
            '' // Empty string for profilePicCid
        );
        await tx.wait();
        
        // Hide transaction status
        transactionStatus.classList.add('d-none');
        
        // Show success message
        showSuccess('Portfolio updated successfully!');
        
        // Reload profile
        loadUserProfile();
    } catch (error) {
        console.error('Error saving profile:', error);
        showError('Failed to save portfolio to blockchain. Please try again.');
        
        // Hide transaction status
        transactionStatus.classList.add('d-none');
    }
}

// Setup event listeners
function setupProfileEventListeners() {
    // Profile form submission
    if (profileForm) {
        profileForm.addEventListener('submit', saveProfile);
    }
    
    // Edit profile button
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            profileView.classList.add('d-none');
            profileFormContainer.classList.remove('d-none');
        });
    }
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    // Setup event listeners specific to profile page
    setupProfileEventListeners();
});
