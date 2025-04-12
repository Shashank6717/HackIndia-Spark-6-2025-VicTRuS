const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  createParentPath: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup provider and contract
let provider;
let ePortfolioContract;

try {
  const contractAddress = require('./src/contracts/contract-address.json').EPortfolio;
  const ePortfolioArtifact = require('./src/artifacts/contracts/EPortfolio.sol/EPortfolio.json');
  
  // Connect to local Hardhat node
  provider = new ethers.providers.JsonRpcProvider(process.env.MUMBAI_RPC_URL || "http://127.0.0.1:8545/");
  
  // Create a signer with the private key
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Create contract instance
  ePortfolioContract = new ethers.Contract(
    contractAddress,
    ePortfolioArtifact.abi,
    signer
  );
  
  console.log("Connected to contract at:", contractAddress);
} catch (error) {
  console.error("Failed to initialize contract:", error.message);
  console.log("Make sure you've deployed the contract and set up the .env file correctly");
}

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/profile', (req, res) => {
  res.render('profile');
});

app.get('/certificates', (req, res) => {
  res.render('certificates');
});

// API endpoints
app.post('/api/upload-certificate', async (req, res) => {
  try {
    if (!req.files || !req.files.certificate) {
      return res.status(400).json({ error: 'No certificate file uploaded' });
    }

    const certificateFile = req.files.certificate;
    const { name, issuer, date } = req.body;
    
    if (!name || !issuer || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real application, you would upload the file to IPFS here
    // For this example, we'll save it locally and use a mock CID
    const uploadPath = path.join(__dirname, 'public/uploads', certificateFile.name);
    await certificateFile.mv(uploadPath);
    
    // Mock IPFS CID - in a real app, this would be the actual IPFS hash
    const mockCid = `mock-cid-${Date.now()}`;
    
    res.json({ 
      success: true, 
      message: 'Certificate data ready for blockchain submission',
      data: {
        name,
        issuer,
        date,
        cid: mockCid
      }
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    res.status(500).json({ error: 'Failed to process certificate upload' });
  }
});

app.post('/api/update-profile', (req, res) => {
  try {
    const { name, title, email, phone, location, bio, skills, education, experience, linkedinUrl, githubUrl, websiteUrl } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const profileData = {
      name,
      title: title || '',
      email,
      phone: phone || '',
      location: location || '',
      bio: bio || '',
      skills: skills || '',
      education: education || '',
      experience: experience || '',
      linkedinUrl: linkedinUrl || '',
      githubUrl: githubUrl || '',
      websiteUrl: websiteUrl || ''
    };
    
    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
