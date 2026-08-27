import { ethers } from "ethers";

import type {
  EvidenceInput,
  EvidenceProof,
  StoredEvidence,
} from "../types/evidence";

import {
  canonicalizeEvidence,
  serializeEvidence,
  hashEvidence,
  recoverEvidenceSigner,
  signEvidence,
} from "../utils/evidenceCrypto";

const STORAGE_KEY = "eduproof:evidence:v1";

/* =====================================================
   WALLET
   ===================================================== */

interface EthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;
}

function getEthereum(): EthereumProvider | null {
  return (
    (window as Window & {
      ethereum?: EthereumProvider;
    }).ethereum ?? null
  );
}

export async function getConnectedWallet(): Promise<{
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
}> {
  const ethereum = getEthereum();

  if (!ethereum) {
    throw new Error("MetaMask is not installed.");
  }

  const provider = new ethers.BrowserProvider(ethereum);

  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  const address = await signer.getAddress();

  return {
    provider,
    signer,
    address,
  };
}

/* =====================================================
   CREATE EVIDENCE
   ===================================================== */

/**
 * Creates an evidence proof using the exact same
 * canonicalization + serialization pipeline that is
 * used by hashEvidence().
 *
 * This prevents canonicalData from disagreeing with
 * the actual cryptographic hash.
 */
export function createEvidence(
  input: EvidenceInput,
): EvidenceProof {
  const canonical = canonicalizeEvidence(input);

  const canonicalData = serializeEvidence(input);

  const evidenceHash = hashEvidence(input);

  const normalizedEvidence: EvidenceInput = {
    ...input,

    title: canonical.title,

    description: canonical.description,

    owner: canonical.owner,

    repository: canonical.repository,

    repositoryCommit:
      canonical.repositoryCommit,

    skills: canonical.skills,

    timestamp: canonical.timestamp,
  };

  return {
    evidence: normalizedEvidence,

    canonicalData,

    evidenceHash,

    status: "DRAFT",

    createdAt: Date.now(),
  };
}

/* =====================================================
   SIGN EVIDENCE
   ===================================================== */

export async function signEvidenceProof(
  proof: EvidenceProof,
): Promise<EvidenceProof> {
  const {
    signer,
    address,
  } = await getConnectedWallet();

  if (
    address.toLowerCase() !==
    proof.evidence.owner.toLowerCase()
  ) {
    throw new Error(
      "Connected wallet does not match the evidence owner.",
    );
  }

  /*
   * Recalculate the hash before signing.
   *
   * This protects against accidental mutation of the
   * evidence object after it was initially created.
   */
  const recalculatedHash = hashEvidence(
    proof.evidence,
  );

  if (
    recalculatedHash.toLowerCase() !==
    proof.evidenceHash.toLowerCase()
  ) {
    throw new Error(
      "Evidence has changed since the proof was created. Please create the proof again.",
    );
  }

  const signature = await signEvidence(
    signer,
    proof.evidenceHash,
  );

  const recoveredSigner =
    recoverEvidenceSigner(
      proof.evidenceHash,
      signature,
    );

  const ownerVerified =
    recoveredSigner.toLowerCase() ===
    proof.evidence.owner.toLowerCase();

  if (!ownerVerified) {
    throw new Error(
      "Evidence signature verification failed.",
    );
  }

  return {
    ...proof,

    signature,

    recoveredSigner,

    ownerVerified,

    status: "SIGNED",
  };
}

/* =====================================================
   LOCAL PERSISTENCE
   ===================================================== */

function readStoredEvidence(): StoredEvidence[] {
  try {
    const raw = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredEvidence[];
  } catch (error) {
    console.error(
      "Unable to read stored evidence:",
      error,
    );

    return [];
  }
}

function writeStoredEvidence(
  evidence: StoredEvidence[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(evidence),
  );
}

/* =====================================================
   SAVE
   ===================================================== */

export function saveEvidence(
  proof: EvidenceProof,
): StoredEvidence {
  const now = Date.now();

  const stored: StoredEvidence = {
    ...proof,

    id: `${proof.evidenceHash}-${now}`,

    updatedAt: now,
  };

  const existing = readStoredEvidence();

  existing.unshift(stored);

  writeStoredEvidence(existing);

  return stored;
}

/* =====================================================
   UPDATE
   ===================================================== */

export function updateStoredEvidence(
  evidence: StoredEvidence,
): StoredEvidence {
  const existing = readStoredEvidence();

  const updated: StoredEvidence = {
    ...evidence,

    updatedAt: Date.now(),
  };

  const index = existing.findIndex(
    (item) => item.id === evidence.id,
  );

  if (index === -1) {
    existing.unshift(updated);
  } else {
    existing[index] = updated;
  }

  writeStoredEvidence(existing);

  return updated;
}

/* =====================================================
   MARK ANCHORED
   ===================================================== */

/**
 * Updates a locally stored evidence record after
 * EvidenceRegistry confirms the blockchain transaction.
 */
export function markEvidenceAnchored(
  evidenceId: string,
  transactionHash: string,
  blockNumber: number,
): StoredEvidence | null {
  const existing = readStoredEvidence();

  const index = existing.findIndex(
    (item) => item.id === evidenceId,
  );

  if (index === -1) {
    return null;
  }

  const updated: StoredEvidence = {
    ...existing[index],

    status: "ANCHORED",

    anchorTransactionHash:
      transactionHash,

    anchorBlockNumber:
      blockNumber,

    updatedAt: Date.now(),
  };

  existing[index] = updated;

  writeStoredEvidence(existing);

  return updated;
}

/* =====================================================
   MARK REVOKED
   ===================================================== */

/**
 * Updates a locally stored evidence record after
 * the blockchain confirms revocation.
 */
export function markEvidenceRevoked(
  evidenceId: string,
): StoredEvidence | null {
  const existing = readStoredEvidence();

  const index = existing.findIndex(
    (item) => item.id === evidenceId,
  );

  if (index === -1) {
    return null;
  }

  const updated: StoredEvidence = {
    ...existing[index],

    status: "REVOKED",

    updatedAt: Date.now(),
  };

  existing[index] = updated;

  writeStoredEvidence(existing);

  return updated;
}

/* =====================================================
   GET ALL
   ===================================================== */

export function getStoredEvidence(): StoredEvidence[] {
  return readStoredEvidence();
}

/* =====================================================
   GET BY ID
   ===================================================== */

export function getStoredEvidenceById(
  id: string,
): StoredEvidence | null {
  const evidence = readStoredEvidence();

  return (
    evidence.find(
      (item) => item.id === id,
    ) ?? null
  );
}

/* =====================================================
   GET BY OWNER
   ===================================================== */

export function getEvidenceByOwner(
  owner: string,
): StoredEvidence[] {
  const normalizedOwner =
    owner.trim().toLowerCase();

  return readStoredEvidence().filter(
    (item) =>
      item.evidence.owner.toLowerCase() ===
      normalizedOwner,
  );
}

/* =====================================================
   DELETE
   ===================================================== */

export function deleteStoredEvidence(
  id: string,
): void {
  const existing = readStoredEvidence();

  const filtered = existing.filter(
    (item) => item.id !== id,
  );

  writeStoredEvidence(filtered);
}

/* =====================================================
   CLEAR ALL
   ===================================================== */

export function clearStoredEvidence(): void {
  localStorage.removeItem(STORAGE_KEY);
}