import { network } from "hardhat";
import { createStudentDID } from "./didUtils.js";

async function main() {
  const { ethers } =
    await network.connect();

  const [student] =
    await ethers.getSigners();

  const did =
    createStudentDID(
      student.address
    );

  console.log(
    "Student wallet:",
    student.address
  );

  console.log(
    "Student DID:",
    did
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});