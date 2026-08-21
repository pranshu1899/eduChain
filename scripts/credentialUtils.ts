import { ethers } from "ethers";

export interface CredentialMetadata {
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  version: number;
}

export function createCredentialHash(
  metadata: CredentialMetadata
): string {
  return ethers.solidityPackedKeccak256(
    [
      "string",
      "string",
      "string",
      "string",
      "string",
      "string",
      "uint256",
    ],
    [
      metadata.studentDID,
      metadata.credentialType,
      metadata.institution,
      metadata.institutionId,
      metadata.degree,
      metadata.issueDate,
      metadata.version,
    ]
  );
}