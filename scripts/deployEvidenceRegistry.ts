import { network } from "hardhat";

async function main() {

  const { ethers } =
    await network.connect();

  console.log(
    "Deploying EvidenceRegistry..."
  );

  // =========================================================
  // DEPLOY
  // =========================================================

  const EvidenceRegistry =
    await ethers.getContractFactory(
      "EvidenceRegistry"
    );

  const registry =
    await EvidenceRegistry.deploy();

  await registry.waitForDeployment();

  const address =
    await registry.getAddress();

  // =========================================================
  // OUTPUT
  // =========================================================

  console.log(
    "\n========================================"
  );

  console.log(
    "EvidenceRegistry deployed successfully!"
  );

  console.log(
    "Contract address:",
    address
  );

  console.log(
    "Network: Sepolia"
  );

  console.log(
    "========================================"
  );

  console.log(
    "\nSave this address for the frontend."
  );
}

main().catch((error) => {

  console.error(
    "\nDeployment failed:"
  );

  console.error(
    error
  );

  process.exitCode = 1;
});