import { ethers } from "ethers";

import EvidenceRegistryArtifact from "../abi/EvidenceRegistry.json";

export const EVIDENCE_REGISTRY_ADDRESS =
  "0x25c249e4E03a47ae0a565aaDc1b879ea6f628D4a";

const SEPOLIA_CHAIN_ID =
  11155111n;

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

async function getProvider():
  Promise<ethers.BrowserProvider> {
  return new ethers.BrowserProvider(
    getEthereum(),
  );
}

async function ensureSepolia(
  provider: ethers.BrowserProvider,
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

async function getEvidenceRegistry(
  readOnly = false,
): Promise<ethers.Contract> {
  const provider =
    await getProvider();

  await ensureSepolia(
    provider,
  );

  if (readOnly) {
    return new ethers.Contract(
      EVIDENCE_REGISTRY_ADDRESS,
      EvidenceRegistryArtifact.abi,
      provider,
    );
  }

  await provider.send(
    "eth_requestAccounts",
    [],
  );

  const signer =
    await provider.getSigner();

  return new ethers.Contract(
    EVIDENCE_REGISTRY_ADDRESS,
    EvidenceRegistryArtifact.abi,
    signer,
  );
}

function validateEvidenceHash(
  evidenceHash: string,
): void {
  if (
    !ethers.isHexString(
      evidenceHash,
      32,
    )
  ) {
    throw new Error(
      "Invalid evidence hash. Expected a 32-byte hash.",
    );
  }
}

/*
 * =========================================================
 * ANCHOR
 * =========================================================
 */

export async function anchorEvidence(
  evidenceHash: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  validateEvidenceHash(
    evidenceHash,
  );

  const contract =
    await getEvidenceRegistry(
      false,
    );

  const existing =
    await contract.verifyEvidence(
      evidenceHash,
    );

  if (existing.exists) {
    throw new Error(
      "This evidence hash is already anchored on-chain.",
    );
  }

  const transaction =
    await contract.anchorEvidence(
      evidenceHash,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Evidence transaction was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,

    blockNumber:
      receipt.blockNumber,
  };
}

/*
 * =========================================================
 * READ EVIDENCE
 * =========================================================
 */

export async function getEvidence(
  evidenceHash: string,
): Promise<{
  hash: string;
  owner: string;
  anchoredAt: number;
  status: number;
}> {
  validateEvidenceHash(
    evidenceHash,
  );

  const contract =
    await getEvidenceRegistry(
      true,
    );

  const result =
    await contract.getEvidence(
      evidenceHash,
    );

  return {
    hash:
      String(result.hash),

    owner:
      String(result.owner),

    anchoredAt:
      Number(
        result.anchoredAt,
      ),

    status:
      Number(
        result.status,
      ),
  };
}

/*
 * =========================================================
 * PUBLIC / STUDENT INTEGRITY VERIFICATION
 * =========================================================
 *
 * expectedOwner is optional.
 *
 * Student:
 *
 * verifyEvidenceIntegrity(
 *   hash,
 *   walletAddress,
 * )
 *
 * Public verifier:
 *
 * verifyEvidenceIntegrity(
 *   hash,
 * )
 */

export async function verifyEvidenceIntegrity(
  evidenceHash: string,
  expectedOwner?: string,
): Promise<{
  verified: boolean;
  exists: boolean;
  ownerMatches: boolean;
  active: boolean;
  owner: string;
  anchoredAt: number;
  status: number;
  reason: string;
}> {
  validateEvidenceHash(
    evidenceHash,
  );

  const contract =
    await getEvidenceRegistry(
      true,
    );

  const result =
    await contract.verifyEvidence(
      evidenceHash,
    );

  const exists =
    Boolean(
      result.exists,
    );

  if (!exists) {
    return {
      verified: false,
      exists: false,
      ownerMatches: false,
      active: false,
      owner: "",
      anchoredAt: 0,
      status: 0,
      reason:
        "This evidence hash is not anchored on Ethereum Sepolia.",
    };
  }

  const owner =
    String(
      result.owner,
    );

  const anchoredAt =
    Number(
      result.anchoredAt,
    );

  const status =
    Number(
      result.status,
    );

  /*
   * EvidenceRegistry enum:
   *
   * 0 = NONE
   * 1 = ANCHORED
   * 2 = REVOKED
   */

  const active =
    status === 1;

  /*
   * If there is no expected owner,
   * public verification only checks
   * blockchain existence + active status.
   */
  const ownerMatches =
    expectedOwner
      ? ethers.isAddress(
          expectedOwner,
        ) &&
        owner.toLowerCase() ===
          expectedOwner.toLowerCase()
      : true;

  const verified =
    exists &&
    active &&
    ownerMatches;

  let reason =
    "Evidence verification failed.";

  if (verified) {
    reason =
      "Evidence hash exists on Ethereum Sepolia and is currently active.";
  } else if (!active) {
    reason =
      "Evidence exists on-chain but has been revoked.";
  } else if (!ownerMatches) {
    reason =
      "Evidence exists on-chain, but the expected owner does not match.";
  }

  return {
    verified,
    exists,
    ownerMatches,
    active,
    owner,
    anchoredAt,
    status,
    reason,
  };
}

/*
 * =========================================================
 * ACTIVE CHECK
 * =========================================================
 */

export async function isEvidenceActive(
  evidenceHash: string,
): Promise<boolean> {
  validateEvidenceHash(
    evidenceHash,
  );

  const contract =
    await getEvidenceRegistry(
      true,
    );

  return Boolean(
    await contract.isEvidenceActive(
      evidenceHash,
    ),
  );
}

/*
 * =========================================================
 * OWNER CHECK
 * =========================================================
 */

export async function verifyEvidenceOwner(
  evidenceHash: string,
  expectedOwner: string,
): Promise<boolean> {
  validateEvidenceHash(
    evidenceHash,
  );

  if (
    !ethers.isAddress(
      expectedOwner,
    )
  ) {
    return false;
  }

  const contract =
    await getEvidenceRegistry(
      true,
    );

  return Boolean(
    await contract.isEvidenceOwner(
      evidenceHash,
      expectedOwner,
    ),
  );
}

/*
 * =========================================================
 * REVOKE
 * =========================================================
 */

export async function revokeEvidence(
  evidenceHash: string,
): Promise<{
  transactionHash: string;
  blockNumber: number;
}> {
  validateEvidenceHash(
    evidenceHash,
  );

  const contract =
    await getEvidenceRegistry(
      false,
    );

  const transaction =
    await contract.revokeEvidence(
      evidenceHash,
    );

  const receipt =
    await transaction.wait();

  if (!receipt) {
    throw new Error(
      "Evidence revocation was not confirmed.",
    );
  }

  return {
    transactionHash:
      receipt.hash,

    blockNumber:
      receipt.blockNumber,
  };
}

/*
 * =========================================================
 * ANALYTICS
 * =========================================================
 */

export async function getTotalEvidenceAnchored():
  Promise<number> {
  const contract =
    await getEvidenceRegistry(
      true,
    );

  const total =
    await contract.totalEvidenceAnchored();

  return Number(total);
}

export async function getTotalEvidenceRevoked():
  Promise<number> {
  const contract =
    await getEvidenceRegistry(
      true,
    );

  const total =
    await contract.totalEvidenceRevoked();

  return Number(total);
}