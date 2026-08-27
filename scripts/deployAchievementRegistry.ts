import hre from "hardhat";

async function main() {
  console.log(
    "Starting AchievementRegistry deployment...",
  );

  // Hardhat 3:
  // ethers is provided by the network connection.
  const { ethers } =
    await hre.network.connect();

  const [deployer] =
    await ethers.getSigners();

  console.log(
    `Deployer: ${deployer.address}`,
  );

  const balance =
    await ethers.provider.getBalance(
      deployer.address,
    );

  console.log(
    `Deployer balance: ${ethers.formatEther(balance)} ETH`,
  );

  const AchievementRegistry =
    await ethers.getContractFactory(
      "AchievementRegistry",
    );

  console.log(
    "Deploying AchievementRegistry...",
  );

  const registry =
    await AchievementRegistry.deploy();

  await registry.waitForDeployment();

  const address =
    await registry.getAddress();

  console.log("");
  console.log(
    "==========================================",
  );
  console.log(
    "AchievementRegistry deployed successfully!",
  );
  console.log(
    "==========================================",
  );
  console.log(
    `Contract address: ${address}`,
  );
  console.log(
    "Network: Ethereum Sepolia",
  );
  console.log(
    `Deployer: ${deployer.address}`,
  );
  console.log(
    `Transaction: ${registry.deploymentTransaction()?.hash ?? "unknown"}`,
  );
  console.log(
    "==========================================",
  );
  console.log("");
  console.log(
    "IMPORTANT: Save this contract address.",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "AchievementRegistry deployment failed:",
  );
  console.error(error);
  process.exitCode = 1;
});