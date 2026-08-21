import { ethers } from "ethers";

export function createStudentDID(
  walletAddress: string
): string {
  const identifier =
    ethers.keccak256(
      ethers.getBytes(
        walletAddress
      )
    ).slice(2, 42);

  return `did:eduproof:${identifier}`;
}