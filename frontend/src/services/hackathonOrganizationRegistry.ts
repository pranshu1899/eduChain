import { ethers } from "ethers";

/* =====================================================
   NETWORK
   ===================================================== */

export const SEPOLIA_CHAIN_ID = 11155111n;

const SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

/* =====================================================
   CONTRACT
   ===================================================== */

const configuredAddress =
  import.meta.env
    .VITE_HACKATHON_ORGANIZATION_REGISTRY_ADDRESS as
    | string
    | undefined;

export const HACKATHON_ORGANIZATION_REGISTRY_ADDRESS =
  configuredAddress?.trim() ?? "";

/* =====================================================
   ABI
   ===================================================== */

export const HACKATHON_ORGANIZATION_REGISTRY_ABI = [
  "function requestOrganization(string organizationName)",
  "function approveOrganization(address organizationWallet)",
  "function rejectOrganization(address organizationWallet)",
  "function revokeOrganization(address organizationWallet)",
  "function isOrganizationApproved(address organizationWallet) view returns (bool)",
  "function getOrganization(address organizationWallet) view returns (address wallet, string organizationName, uint8 status, uint256 submittedAt, uint256 approvedAt, uint256 updatedAt)",
  "function anchorCertificateBatch(bytes32 batchId, bytes32 merkleRoot, uint256 certificateCount, string metadataURI)",
  "function getCertificateBatch(bytes32 batchId) view returns (bytes32 id, address organization, bytes32 merkleRoot, uint256 certificateCount, uint256 anchoredAt, string metadataURI, bool exists)",
  "function verifyCertificateBatch(bytes32 batchId, bytes32 expectedMerkleRoot) view returns (bool)",
  "function isAdmin(address account) view returns (bool)",
  "function admin() view returns (address)",
  "event CertificateBatchAnchored(bytes32 indexed batchId, address indexed organization, bytes32 indexed merkleRoot, uint256 certificateCount, uint256 anchoredAt)",
];

/* =====================================================
   TYPES
   ===================================================== */

export type HackathonOrganizationBlockchainStatus =
  | "NONE"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED";

export interface HackathonOrganizationBlockchainRecord {
  wallet: string;
  organizationName: string;
  status: HackathonOrganizationBlockchainStatus;
  statusCode: number;
  submittedAt: number;
  approvedAt: number;
  updatedAt: number;
}

export interface CertificateBatchBlockchainRecord {
  id: string;
  organization: string;
  merkleRoot: string;
  certificateCount: number;
  anchoredAt: number;
  metadataURI: string;
  exists: boolean;
}

/* =====================================================
   VALIDATION
   ===================================================== */

function requireContractAddress(): string {
  if (
    !HACKATHON_ORGANIZATION_REGISTRY_ADDRESS
  ) {
    throw new Error(
      "HackathonOrganizationRegistry address is not configured. Add VITE_HACKATHON_ORGANIZATION_REGISTRY_ADDRESS to frontend/.env.",
    );
  }

  if (
    !ethers.isAddress(
      HACKATHON_ORGANIZATION_REGISTRY_ADDRESS,
    )
  ) {
    throw new Error(
      "Invalid HackathonOrganizationRegistry contract address.",
    );
  }

  return HACKATHON_ORGANIZATION_REGISTRY_ADDRESS;
}

function validateBytes32(
  value: string,
  fieldName: string,
): void {
  if (
    !ethers.isHexString(
      value,
      32,
    )
  ) {
    throw new Error(
      `${fieldName} must be a valid bytes32 value.`,
    );
  }
}

/* =====================================================
   PROVIDERS
   ===================================================== */

function getReadOnlyProvider():
  ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    SEPOLIA_RPC_URL,
  );
}

function getEthereum():
  ethers.Eip1193Provider {
  const ethereum =
    window.ethereum;

  if (!ethereum) {
    throw new Error(
      "MetaMask is not installed.",
    );
  }

  return ethereum;
}

async function getBrowserProvider():
  Promise<ethers.BrowserProvider> {
  return new ethers.BrowserProvider(
    getEthereum(),
  );
}

/* =====================================================
   NETWORK
   ===================================================== */

async function ensureSepolia(
  provider:
    | ethers.BrowserProvider
    | ethers.JsonRpcProvider,
): Promise<void> {
  const network =
    await provider.getNetwork();

  if (
    network.chainId !==
    SEPOLIA_CHAIN_ID
  ) {
    throw new Error(
      "Please switch MetaMask to Ethereum Sepolia.",
    );
  }
}

/* =====================================================
   CONTRACTS
   ===================================================== */

function getReadOnlyContract():
  ethers.Contract {
  return new ethers.Contract(
    requireContractAddress(),
    HACKATHON_ORGANIZATION_REGISTRY_ABI,
    getReadOnlyProvider(),
  );
}

async function getSignerContract():
  Promise<{
    contract: ethers.Contract;
    address: string;
  }> {
  const provider =
    await getBrowserProvider();

  await ensureSepolia(
    provider,
  );

  await provider.send(
    "eth_requestAccounts",
    [],
  );

  const signer =
    await provider.getSigner();

  const address =
    await signer.getAddress();

  return {
    contract:
      new ethers.Contract(
        requireContractAddress(),
        HACKATHON_ORGANIZATION_REGISTRY_ABI,
        signer,
      ),
    address,
  };
}

/* =====================================================
   ORGANIZATION STATUS
   ===================================================== */

function organizationStatus(
  statusCode: number,
): HackathonOrganizationBlockchainStatus {
  switch (statusCode) {
    case 1:
      return "PENDING";

    case 2:
      return "APPROVED";

    case 3:
      return "REJECTED";

    case 4:
      return "REVOKED";

    default:
      return "NONE";
  }
}

/* =====================================================
   REQUEST ORGANIZATION
   ===================================================== */

export async function requestHackathonOrganizationOnChain(
  organizationName: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  const normalized =
    organizationName.trim();

  if (!normalized) {
    throw new Error(
      "Organization name is required.",
    );
  }

  const {
    contract,
  } =
    await getSignerContract();

  const transaction =
    await contract.requestOrganization(
      normalized,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Organization request transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,
    blockNumber:
      receipt.blockNumber,
  };
}

/* =====================================================
   APPROVE ORGANIZATION
   ===================================================== */

export async function approveHackathonOrganizationOnChain(
  organizationWallet: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  const {
    contract,
  } =
    await getSignerContract();

  const transaction =
    await contract.approveOrganization(
      organizationWallet,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Organization approval transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,
    blockNumber:
      receipt.blockNumber,
  };
}

/* =====================================================
   REJECT ORGANIZATION
   ===================================================== */

export async function rejectHackathonOrganizationOnChain(
  organizationWallet: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  const {
    contract,
  } =
    await getSignerContract();

  const transaction =
    await contract.rejectOrganization(
      organizationWallet,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Organization rejection transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,
    blockNumber:
      receipt.blockNumber,
  };
}

/* =====================================================
   REVOKE ORGANIZATION
   ===================================================== */

export async function revokeHackathonOrganizationOnChain(
  organizationWallet: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  const {
    contract,
  } =
    await getSignerContract();

  const transaction =
    await contract.revokeOrganization(
      organizationWallet,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Organization revocation transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,
    blockNumber:
      receipt.blockNumber,
  };
}

/* =====================================================
   GET ORGANIZATION
   ===================================================== */

export async function getHackathonOrganizationOnChain(
  organizationWallet: string,
): Promise<HackathonOrganizationBlockchainRecord> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    throw new Error(
      "Invalid organization wallet address.",
    );
  }

  const contract =
    getReadOnlyContract();

  const result =
    await contract.getOrganization(
      organizationWallet,
    );

  const statusCode =
    Number(result.status);

  return {
    wallet:
      String(result.wallet),

    organizationName:
      String(
        result.organizationName,
      ),

    status:
      organizationStatus(
        statusCode,
      ),

    statusCode,

    submittedAt:
      Number(
        result.submittedAt,
      ),

    approvedAt:
      Number(
        result.approvedAt,
      ),

    updatedAt:
      Number(
        result.updatedAt,
      ),
  };
}

/* =====================================================
   CHECK ORGANIZATION
   ===================================================== */

export async function isHackathonOrganizationApprovedOnChain(
  organizationWallet: string,
): Promise<boolean> {
  if (
    !ethers.isAddress(
      organizationWallet,
    )
  ) {
    return false;
  }

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.isOrganizationApproved(
      organizationWallet,
    ),
  );
}

/* =====================================================
   ANCHOR CERTIFICATE BATCH
   ===================================================== */

export async function anchorHackathonCertificateBatch(
  batchId: string,
  merkleRoot: string,
  certificateCount: number,
  metadataURI = "",
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  validateBytes32(
    batchId,
    "Batch ID",
  );

  validateBytes32(
    merkleRoot,
    "Merkle root",
  );

  if (
    !Number.isInteger(
      certificateCount,
    ) ||
    certificateCount <= 0
  ) {
    throw new Error(
      "Certificate count must be a positive integer.",
    );
  }

  const {
    contract,
    address: signerAddress,
  } =
    await getSignerContract();

  if (
    !ethers.isAddress(
      signerAddress,
    )
  ) {
    throw new Error(
      "Unable to determine connected wallet.",
    );
  }

  const approved =
    await contract.isOrganizationApproved(
      signerAddress,
    );

  if (!approved) {
    throw new Error(
      "Connected wallet is not an approved hackathon organization.",
    );
  }

  const existing =
    await contract.getCertificateBatch(
      batchId,
    );

  if (
    Boolean(existing.exists)
  ) {
    throw new Error(
      "This certificate batch is already anchored on-chain.",
    );
  }

  const transaction =
    await contract.anchorCertificateBatch(
      batchId,
      merkleRoot,
      certificateCount,
      metadataURI.trim(),
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Certificate batch transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,

    blockNumber:
      receipt.blockNumber,
  };
}

/* =====================================================
   GET CERTIFICATE BATCH
   ===================================================== */

export async function getHackathonCertificateBatchOnChain(
  batchId: string,
): Promise<CertificateBatchBlockchainRecord> {
  validateBytes32(
    batchId,
    "Batch ID",
  );

  const contract =
    getReadOnlyContract();

  const result =
    await contract.getCertificateBatch(
      batchId,
    );

  return {
    id:
      String(result.id),

    organization:
      String(result.organization),

    merkleRoot:
      String(result.merkleRoot),

    certificateCount:
      Number(
        result.certificateCount,
      ),

    anchoredAt:
      Number(
        result.anchoredAt,
      ),

    metadataURI:
      String(
        result.metadataURI,
      ),

    exists:
      Boolean(result.exists),
  };
}

/* =====================================================
   VERIFY CERTIFICATE BATCH
   ===================================================== */

export async function verifyHackathonCertificateBatchOnChain(
  batchId: string,
  expectedMerkleRoot: string,
): Promise<boolean> {
  validateBytes32(
    batchId,
    "Batch ID",
  );

  validateBytes32(
    expectedMerkleRoot,
    "Merkle root",
  );

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.verifyCertificateBatch(
      batchId,
      expectedMerkleRoot,
    ),
  );
}

/* =====================================================
   ADMIN CHECK
   ===================================================== */

export async function isHackathonRegistryAdmin(
  account: string,
): Promise<boolean> {
  if (
    !ethers.isAddress(
      account,
    )
  ) {
    return false;
  }

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.isAdmin(
      account,
    ),
  );
}