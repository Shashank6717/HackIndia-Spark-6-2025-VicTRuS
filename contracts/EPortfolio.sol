// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract EPortfolio {
    struct Certificate {
        string name;
        string issuer;
        string date;
        string cid; // IPFS Content Identifier for the certificate file
        bool verified;
    }

    // Split the UserProfile into multiple structs to avoid stack too deep errors
    struct UserBasicInfo {
        string name;
        string title; // Professional title
        string email;
        string phone;
        string location;
        string bio;
    }
    
    struct UserProfessionalInfo {
        string skills; // Comma-separated list of skills
        string education; // Education details
        string experience; // Work experience
    }
    
    struct UserSocialInfo {
        string linkedinUrl;
        string githubUrl;
        string websiteUrl;
        string profilePicCid; // IPFS Content Identifier for profile picture
    }
    
    struct UserProfile {
        UserBasicInfo basicInfo;
        UserProfessionalInfo professionalInfo;
        UserSocialInfo socialInfo;
        bool exists;
    }

    // Mapping from user address to their profile
    mapping(address => UserProfile) public userProfiles;
    
    // Mapping from user address to their certificates
    mapping(address => Certificate[]) public userCertificates;

    // Events
    event ProfileCreated(address indexed user, string name);
    event ProfileUpdated(address indexed user, string name);
    event CertificateAdded(address indexed user, string name, string issuer);

    // Create or update user basic info
    function setUserBasicInfo(
        string memory _name,
        string memory _title,
        string memory _email,
        string memory _phone,
        string memory _location,
        string memory _bio
    ) public {
        UserProfile storage profile = userProfiles[msg.sender];
        
        profile.basicInfo.name = _name;
        profile.basicInfo.title = _title;
        profile.basicInfo.email = _email;
        profile.basicInfo.phone = _phone;
        profile.basicInfo.location = _location;
        profile.basicInfo.bio = _bio;
        
        if (!profile.exists) {
            profile.exists = true;
            emit ProfileCreated(msg.sender, _name);
        } else {
            emit ProfileUpdated(msg.sender, _name);
        }
    }
    
    // Set user professional info
    function setUserProfessionalInfo(
        string memory _skills,
        string memory _education,
        string memory _experience
    ) public {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.exists, "Profile does not exist");
        
        profile.professionalInfo.skills = _skills;
        profile.professionalInfo.education = _education;
        profile.professionalInfo.experience = _experience;
        
        emit ProfileUpdated(msg.sender, profile.basicInfo.name);
    }
    
    // Set user social info
    function setUserSocialInfo(
        string memory _linkedinUrl,
        string memory _githubUrl,
        string memory _websiteUrl,
        string memory _profilePicCid
    ) public {
        UserProfile storage profile = userProfiles[msg.sender];
        require(profile.exists, "Profile does not exist");
        
        profile.socialInfo.linkedinUrl = _linkedinUrl;
        profile.socialInfo.githubUrl = _githubUrl;
        profile.socialInfo.websiteUrl = _websiteUrl;
        profile.socialInfo.profilePicCid = _profilePicCid;
        
        emit ProfileUpdated(msg.sender, profile.basicInfo.name);
    }

    // Add a certificate to user's portfolio
    function addCertificate(
        string memory _name,
        string memory _issuer,
        string memory _date,
        string memory _cid
    ) public {
        require(userProfiles[msg.sender].exists, "Profile does not exist");
        
        Certificate memory newCertificate = Certificate({
            name: _name,
            issuer: _issuer,
            date: _date,
            cid: _cid,
            verified: false
        });
        
        userCertificates[msg.sender].push(newCertificate);
        
        emit CertificateAdded(msg.sender, _name, _issuer);
    }

    // Get user basic info
    function getUserBasicInfo(address _user) public view returns (
        string memory name,
        string memory title,
        string memory email,
        string memory phone,
        string memory location,
        string memory bio
    ) {
        UserProfile memory profile = userProfiles[_user];
        return (
            profile.basicInfo.name,
            profile.basicInfo.title,
            profile.basicInfo.email,
            profile.basicInfo.phone,
            profile.basicInfo.location,
            profile.basicInfo.bio
        );
    }
    
    // Get user professional info
    function getUserProfessionalInfo(address _user) public view returns (
        string memory skills,
        string memory education,
        string memory experience
    ) {
        UserProfile memory profile = userProfiles[_user];
        return (
            profile.professionalInfo.skills,
            profile.professionalInfo.education,
            profile.professionalInfo.experience
        );
    }
    
    // Get user social info
    function getUserSocialInfo(address _user) public view returns (
        string memory linkedinUrl,
        string memory githubUrl,
        string memory websiteUrl,
        string memory profilePicCid
    ) {
        UserProfile memory profile = userProfiles[_user];
        return (
            profile.socialInfo.linkedinUrl,
            profile.socialInfo.githubUrl,
            profile.socialInfo.websiteUrl,
            profile.socialInfo.profilePicCid
        );
    }
    
    // Check if user profile exists
    function userProfileExists(address _user) public view returns (bool) {
        return userProfiles[_user].exists;
    }

    // Get certificate count for a user
    function getCertificateCount(address _user) public view returns (uint256) {
        return userCertificates[_user].length;
    }

    // Get certificate details by index
    function getCertificate(address _user, uint256 _index) public view returns (
        string memory name,
        string memory issuer,
        string memory date,
        string memory cid,
        bool verified
    ) {
        require(_index < userCertificates[_user].length, "Certificate does not exist");
        
        Certificate memory cert = userCertificates[_user][_index];
        return (
            cert.name,
            cert.issuer,
            cert.date,
            cert.cid,
            cert.verified
        );
    }
}
