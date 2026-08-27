import { ethers } from "ethers";

/* =====================================================
   CONTRACT
   ===================================================== */

export const ACHIEVEMENT_REGISTRY_ADDRESS =
  "0x105467216D63D4Ab07155F231953B50A6ddD41fb";

export const ACHIEVEMENT_REGISTRY_ABI = [
  "function anchorAchievement(bytes32 achievementId, bytes32 merkleRoot) returns (bool)",

  "function verifyAchievement(bytes32 achievementId) view returns (bool exists, bytes32 merkleRoot, address owner, uint256 anchoredAt, uint8 status)",

  "function getAchievement(bytes32 achievementId) view returns (bytes32 id, bytes32 merkleRoot, address owner, uint256 anchoredAt, uint8 status)",

  "function verifyMerkleRoot(bytes32 achievementId, bytes32 expectedMerkleRoot) view returns (bool)",

  "function isAchievementOwner(bytes32 achievementId, address expectedOwner) view returns (bool)",

  "function isAchievementActive(bytes32 achievementId) view returns (bool)",

  "function revokeAchievement(bytes32 achievementId)",

  "function verifyAchievementProof(bytes32 achievementId, bytes32 expectedMerkleRoot, address expectedOwner) view returns (bool)",

  "function totalAchievementsAnchored() view returns (uint256)",

  "function totalAchievementsRevoked() view returns (uint256)",
];

/* =====================================================
   NETWORK
   ===================================================== */

export const SEPOLIA_CHAIN_ID = 11155111n;

const SEPOLIA_RPC_URL =
  "https://ethereum-sepolia-rpc.publicnode.com";

/* =====================================================
   BLOCKCHAIN STATUS
   ===================================================== */

export type AchievementBlockchainStatus =
  | "NONE"
  | "ANCHORED"
  | "REVOKED";

/* =====================================================
   BLOCKCHAIN RECORD
   ===================================================== */

export interface AchievementBlockchainRecord {
  exists: boolean;
  achievementId: string;
  merkleRoot: string;
  owner: string;
  anchoredAt: number;
  status: AchievementBlockchainStatus;
  statusCode: number;
}

/* =====================================================
   INTEGRITY RESULT
   ===================================================== */

export interface AchievementIntegrityResult {
  verified: boolean;

  exists: boolean;

  active: boolean;

  ownerMatches: boolean;

  merkleRootMatches: boolean;

  blockchainExists: boolean;

  blockchainActive: boolean;

  achievementId: string;

  owner: string;

  localMerkleRoot: string;

  onChainMerkleRoot: string;

  anchoredAt: number;

  status: AchievementBlockchainStatus;

  reason: string;
}

/* =====================================================
   READ-ONLY PROVIDER
   ===================================================== */

function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(
    SEPOLIA_RPC_URL,
  );
}

/* =====================================================
   METAMASK PROVIDER
   ===================================================== */

function getEthereum(): ethers.Eip1193Provider {
  const ethereum = window.ethereum;

  if (!ethereum) {
    throw new Error(
      "MetaMask is not installed.",
    );
  }

  return ethereum;
}

/* =====================================================
   BROWSER PROVIDER
   ===================================================== */

async function getBrowserProvider(): Promise<ethers.BrowserProvider> {
  return new ethers.BrowserProvider(
    getEthereum(),
  );
}

/* =====================================================
   ENSURE SEPOLIA
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
   READ-ONLY CONTRACT
   ===================================================== */

function getReadOnlyContract(): ethers.Contract {
  const provider =
    getReadOnlyProvider();

  return new ethers.Contract(
    ACHIEVEMENT_REGISTRY_ADDRESS,
    ACHIEVEMENT_REGISTRY_ABI,
    provider,
  );
}

/* =====================================================
   WALLET CONTRACT
   ===================================================== */

async function getWalletContract(): Promise<ethers.Contract> {
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

  return new ethers.Contract(
    ACHIEVEMENT_REGISTRY_ADDRESS,
    ACHIEVEMENT_REGISTRY_ABI,
    signer,
  );
}

/* =====================================================
   VALIDATE BYTES32
   ===================================================== */

function validateBytes32(
  value: string,
  label: string,
): void {
  if (
    !ethers.isHexString(
      value,
      32,
    )
  ) {
    throw new Error(
      `${label} must be a valid bytes32 value.`,
    );
  }
}

/* =====================================================
   CREATE ACHIEVEMENT ID
   ===================================================== */

export function createAchievementId(
  owner: string,
  evidenceHashes: string[],
): string {
  if (
    !ethers.isAddress(owner)
  ) {
    throw new Error(
      "Invalid achievement owner address.",
    );
  }

  if (
    evidenceHashes.length === 0
  ) {
    throw new Error(
      "An achievement must contain at least one evidence hash.",
    );
  }

  const normalizedHashes =
    evidenceHashes.map(
      (hash) => {
        validateBytes32(
          hash,
          "Evidence hash",
        );

        return hash.toLowerCase();
      },
    );

  const uniqueHashes =
    Array.from(
      new Set(normalizedHashes),
    ).sort();

  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      [
        "string",
        "address",
        "bytes32[]",
      ],
      [
        "EDUPROOF_ACHIEVEMENT",
        owner,
        uniqueHashes,
      ],
    ),
  );
}

/* =====================================================
   ANCHOR ACHIEVEMENT
   ===================================================== */

export async function anchorAchievement(
  achievementId: string,
  merkleRoot: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  validateBytes32(
    merkleRoot,
    "Merkle root",
  );

  const contract =
    await getWalletContract();

  const existing =
    await contract.verifyAchievement(
      achievementId,
    );

  if (
    Boolean(existing.exists)
  ) {
    throw new Error(
      "This achievement is already anchored on-chain.",
    );
  }

  const transaction =
    await contract.anchorAchievement(
      achievementId,
      merkleRoot,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Achievement transaction was not confirmed.",
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
   VERIFY ACHIEVEMENT
   ===================================================== */

export async function verifyAchievement(
  achievementId: string,
): Promise<AchievementBlockchainRecord> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  const contract =
    getReadOnlyContract();

  const result =
    await contract.verifyAchievement(
      achievementId,
    );

  const statusCode =
    Number(result.status);

  let status:
    AchievementBlockchainStatus;

  switch (statusCode) {
    case 1:
      status = "ANCHORED";
      break;

    case 2:
      status = "REVOKED";
      break;

    default:
      status = "NONE";
      break;
  }

  return {
    exists:
      Boolean(result.exists),

    achievementId,

    merkleRoot:
      String(result.merkleRoot),

    owner:
      String(result.owner),

    anchoredAt:
      Number(result.anchoredAt),

    status,

    statusCode,
  };
}

/* =====================================================
   VERIFY MERKLE ROOT
   ===================================================== */

export async function verifyAchievementMerkleRoot(
  achievementId: string,
  merkleRoot: string,
): Promise<boolean> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  validateBytes32(
    merkleRoot,
    "Merkle root",
  );

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.verifyMerkleRoot(
      achievementId,
      merkleRoot,
    ),
  );
}

/* =====================================================
   VERIFY OWNER
   ===================================================== */

export async function verifyAchievementOwner(
  achievementId: string,
  expectedOwner: string,
): Promise<boolean> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  if (
    !ethers.isAddress(
      expectedOwner,
    )
  ) {
    return false;
  }

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.isAchievementOwner(
      achievementId,
      expectedOwner,
    ),
  );
}

/* =====================================================
   ACTIVE CHECK
   ===================================================== */

export async function isAchievementActive(
  achievementId: string,
): Promise<boolean> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.isAchievementActive(
      achievementId,
    ),
  );
}

/* =====================================================
   FULL PROOF VERIFICATION
   ===================================================== */

export async function verifyAchievementProofOnChain(
  achievementId: string,
  merkleRoot: string,
  expectedOwner: string,
): Promise<boolean> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  validateBytes32(
    merkleRoot,
    "Merkle root",
  );

  if (
    !ethers.isAddress(
      expectedOwner,
    )
  ) {
    return false;
  }

  const contract =
    getReadOnlyContract();

  return Boolean(
    await contract.verifyAchievementProof(
      achievementId,
      merkleRoot,
      expectedOwner,
    ),
  );
}

/* =====================================================
   FULL ACHIEVEMENT INTEGRITY VERIFICATION
   ===================================================== */

export async function verifyAchievementIntegrity(
  achievementId: string,
  expectedOwner: string,
  localMerkleRoot: string,
): Promise<AchievementIntegrityResult> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  validateBytes32(
    localMerkleRoot,
    "Merkle root",
  );

  if (
    !ethers.isAddress(
      expectedOwner,
    )
  ) {
    return {
      verified: false,
      exists: false,
      active: false,
      ownerMatches: false,
      merkleRootMatches: false,
      blockchainExists: false,
      blockchainActive: false,
      achievementId,
      owner: "",
      localMerkleRoot,
      onChainMerkleRoot: "",
      anchoredAt: 0,
      status: "NONE",
      reason:
        "Expected owner is not a valid Ethereum address.",
    };
  }

  try {
    const record =
      await verifyAchievement(
        achievementId,
      );

    const blockchainExists =
      record.exists;

    const blockchainActive =
      record.status ===
      "ANCHORED";

    const ownerMatches =
      blockchainExists &&
      record.owner.toLowerCase() ===
        expectedOwner.toLowerCase();

    const merkleRootMatches =
      blockchainExists &&
      record.merkleRoot.toLowerCase() ===
        localMerkleRoot.toLowerCase();

    const verified =
      blockchainExists &&
      blockchainActive &&
      ownerMatches &&
      merkleRootMatches;

    let reason =
      "Achievement verification failed.";

    if (verified) {
      reason =
        "Achievement exists on Ethereum Sepolia, is active, belongs to the expected owner, and its Merkle root matches.";
    } else if (!blockchainExists) {
      reason =
        "Achievement is not anchored on Ethereum Sepolia.";
    } else if (!blockchainActive) {
      reason =
        "Achievement exists on-chain but has been revoked.";
    } else if (!ownerMatches) {
      reason =
        "Achievement owner does not match the expected owner.";
    } else if (!merkleRootMatches) {
      reason =
        "Achievement Merkle root does not match the blockchain anchor.";
    }

    return {
      verified,

      exists:
        blockchainExists,

      active:
        blockchainActive,

      ownerMatches,

      merkleRootMatches,

      blockchainExists,

      blockchainActive,

      achievementId,

      owner:
        record.owner,

      localMerkleRoot,

      onChainMerkleRoot:
        record.merkleRoot,

      anchoredAt:
        record.anchoredAt,

      status:
        record.status,

      reason,
    };
  } catch (error) {
    return {
      verified: false,

      exists: false,

      active: false,

      ownerMatches: false,

      merkleRootMatches: false,

      blockchainExists: false,

      blockchainActive: false,

      achievementId,

      owner: "",

      localMerkleRoot,

      onChainMerkleRoot: "",

      anchoredAt: 0,

      status: "NONE",

      reason:
        error instanceof Error
          ? error.message
          : "Unable to verify achievement on-chain.",
    };
  }
}

/* =====================================================
   REVOKE ACHIEVEMENT
   ===================================================== */

export async function revokeAchievementOnChain(
  achievementId: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  validateBytes32(
    achievementId,
    "Achievement ID",
  );

  const contract =
    await getWalletContract();

  const transaction =
    await contract.revokeAchievement(
      achievementId,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Achievement revocation was not confirmed.",
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
   TOTAL ACHIEVEMENTS
   ===================================================== */

export async function getTotalAchievementsAnchored():
  Promise<number> {
  const contract =
    getReadOnlyContract();

  const total =
    await contract.totalAchievementsAnchored();

  return Number(total);
}

/* =====================================================
   TOTAL REVOKED
   ===================================================== */

export async function getTotalAchievementsRevoked():
  Promise<number> {
  const contract =
    getReadOnlyContract();

  const total =
    await contract.totalAchievementsRevoked();

  return Number(total);
}