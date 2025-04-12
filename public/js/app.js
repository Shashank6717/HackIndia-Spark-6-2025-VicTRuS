// Global variables
let provider;
let signer;
let ePortfolioContract;
let userAddress;

// Contract information - will be populated after deployment
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Will be filled after deployment
const contractABI = []; // Will be filled after deployment

// Initialize the application
async function initApp() {
  try {
    // Check if ethers is available
    if (typeof ethers === "undefined") {
      console.error("Ethers library not found");
      return;
    }

    // Connect to the local Hardhat node
    provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/");

    // Load contract information from the server
    await loadContractInfo();

    // Show wallet connect button
    document.querySelectorAll("#wallet-connect").forEach((el) => {
      el.classList.remove("d-none");
    });

    // Hide loading indicators
    document
      .querySelectorAll("#profile-loading, #certificates-loading")
      .forEach((el) => {
        el.classList.add("d-none");
      });

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error("Error initializing app:", error);
    showError(
      "Failed to initialize the application. Please check the console for details."
    );
  }
}

// Load contract information from the server
async function loadContractInfo() {
  try {
    const response = await fetch("/js/contract-info.json");
    if (!response.ok) {
      throw new Error("Failed to load contract information");
    }

    const contractInfo = await response.json();
    if (contractInfo.address && contractInfo.abi) {
      ePortfolioContract = new ethers.Contract(
        contractInfo.address,
        contractInfo.abi,
        provider
      );
      console.log("Contract loaded successfully");
    } else {
      throw new Error("Invalid contract information");
    }
  } catch (error) {
    console.error("Error loading contract info:", error);
    showError(
      "Failed to load contract information. Please make sure the contract is deployed."
    );
  }
}

// Setup event listeners
function setupEventListeners() {
  // Connect wallet buttons
  document.querySelectorAll("#connect-wallet").forEach((button) => {
    button.addEventListener("click", connectWallet);
  });
}

// Connect to wallet
async function connectWallet() {
  try {
    // Use the provided account address and private key
    const privateKey =
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    signer = new ethers.Wallet(privateKey, provider);
    userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Set the correct address

    // Connect the contract to the signer
    ePortfolioContract = ePortfolioContract.connect(signer);

    console.log("Connected with address:", userAddress);

    // Hide wallet connect buttons
    document.querySelectorAll("#wallet-connect").forEach((el) => {
      el.classList.add("d-none");
    });

    // Show appropriate content based on the current page
    if (window.location.pathname === "/profile") {
      loadUserProfile();
    } else if (window.location.pathname === "/certificates") {
      loadUserCertificates();
    }

    return true;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    showError("Failed to connect wallet. Please try again.");
    return false;
  }
}

// Show error message
function showError(message) {
  // Create alert element
  const alertEl = document.createElement("div");
  alertEl.className = "alert alert-danger alert-dismissible fade show mt-3";
  alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Find a suitable container to append the alert
  const container = document.querySelector(".container");
  if (container) {
    container.prepend(alertEl);
  }

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertEl.classList.remove("show");
    setTimeout(() => alertEl.remove(), 300);
  }, 5000);
}

// Show success message
function showSuccess(message) {
  // Create alert element
  const alertEl = document.createElement("div");
  alertEl.className = "alert alert-success alert-dismissible fade show mt-3";
  alertEl.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

  // Find a suitable container to append the alert
  const container = document.querySelector(".container");
  if (container) {
    container.prepend(alertEl);
  }

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    alertEl.classList.remove("show");
    setTimeout(() => alertEl.remove(), 300);
  }, 5000);
}

// Format date string
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", initApp);
