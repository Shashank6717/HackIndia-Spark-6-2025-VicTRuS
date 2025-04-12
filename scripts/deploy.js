const hre = require("hardhat");

async function main() {
  console.log("Deploying EPortfolio contract...");

  const EPortfolio = await hre.ethers.getContractFactory("EPortfolio");
  const ePortfolio = await EPortfolio.deploy();

  await ePortfolio.deployed();

  console.log(`EPortfolio deployed to: ${ePortfolio.address}`);
  
  // Store the contract address for frontend use
  const fs = require("fs");
  const contractsDir = __dirname + "/../src/contracts";
  
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  fs.writeFileSync(
    contractsDir + "/contract-address.json",
    JSON.stringify({ EPortfolio: ePortfolio.address }, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
