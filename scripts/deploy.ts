import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Lotto contract...");

  // Get the contract factory
  const Lotto = await ethers.getContractFactory("Lotto");
  
  // Deploy the contract
  const lotto = await Lotto.deploy();
  
  // Wait for deployment to complete
  await lotto.waitForDeployment();
  
  const address = await lotto.getAddress();
  console.log("Lotto contract deployed to:", address);
  
  // Get the deployer (manager) address
  const [deployer] = await ethers.getSigners();
  console.log("Manager address:", deployer.address);
  
  // Get initial contract info
  const lottoInfo = await lotto.getLottoInfo();
  console.log("Initial lottery info:");
  console.log("- Player count:", lottoInfo.playerCount.toString());
  console.log("- Prize pool:", ethers.formatEther(lottoInfo.prizePool), "ETH");
  console.log("- Minimum entry fee:", ethers.formatEther(lottoInfo.minimumEntryFee), "ETH");
  console.log("- Is paused:", await lotto.isPaused());
  
  console.log("\n🎉 Deployment complete!");
  console.log("📝 Next steps:");
  console.log("1. Update CONTRACT_ADDRESS in src/App.tsx to:", address);
  console.log("2. Make sure MetaMask is connected to localhost:8545");
  console.log("3. Import test accounts from Hardhat node into MetaMask");
  console.log("4. Start the React app with: npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
