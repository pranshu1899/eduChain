import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  console.log("Deploying EduProof...");

  const EduProof =
    await ethers.getContractFactory("EduProof");

  const eduProof =
    await EduProof.deploy();

  await eduProof.waitForDeployment();

  const address =
    await eduProof.getAddress();

  console.log(
    "\n================================"
  );

  console.log(
    "EduProof deployed successfully!"
  );

  console.log(
    "Contract address:",
    address
  );

  console.log(
    "Network: Sepolia"
  );

  console.log(
    "================================"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});