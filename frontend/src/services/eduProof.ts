import { ethers } from "ethers";

export const EDUProof_ADDRESS =
  "0x7E86aBA8583f28E8119aD0C632a518f9cFC6A705";

export const EDUProof_ABI = [
  "function getIssuer(address issuer) view returns (address wallet, string institutionName, string institutionId, uint8 status)",
  "function isAuthorizedIssuer(address issuer) view returns (bool)",
  "function getIssuerAnalytics(address issuer) view returns (uint256 issued, uint256 updated, uint256 revoked)",
  "function getCredential(uint256 credentialId) view returns (tuple(uint256 id,uint256 rootCredentialId,address issuer,string studentDID,string credentialType,string institution,string institutionId,string degree,string issueDate,bytes32 credentialHash,bytes signature,string cid,uint256 version,uint8 status,uint256 issuedAt,uint256 previousVersionId))",
  "function getVersionHistory(uint256 credentialId) view returns (uint256[])",
  "function getGlobalAnalytics() view returns (uint256 credentialsIssued,uint256 credentialsUpdated,uint256 credentialsRevoked,uint256 issuersRegistered,uint256 issuersAuthorized)",
  "function totalCredentialsIssued() view returns (uint256)",
  "function totalCredentialsRevoked() view returns (uint256)",
  "function totalCredentialsUpdated() view returns (uint256)",
  "function verifyCredentialSignature(uint256 credentialId) view returns (bool)",
  "function revokeCredential(uint256 credentialId)"
];

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(
    "https://ethereum-sepolia-rpc.publicnode.com"
  );

  return new ethers.Contract(
    EDUProof_ADDRESS,
    EDUProof_ABI,
    provider
  );
}

export async function getWalletContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(
    window.ethereum
  );

  const signer = await provider.getSigner();

  return new ethers.Contract(
    EDUProof_ADDRESS,
    EDUProof_ABI,
    signer
  );
}