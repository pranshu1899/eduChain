import hre from "hardhat";

async function main() {
  console.log(
    "Deploying HackathonOrganizationRegistry...",
  );

  const { ethers } =
    await hre.network.connect();

  const factory =
    await ethers.getContractFactory(
      "HackathonOrganizationRegistry",
    );

  const contract =
    await factory.deploy();

  await contract.waitForDeployment();

  const address =
    await contract.getAddress();

  console.log("");
  console.log("================================");
  console.log(
    "HackathonOrganizationRegistry deployed successfully!",
  );
  console.log(
    `Contract address: ${address}`,
  );
  console.log("Network: Sepolia");
  console.log("================================");
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});