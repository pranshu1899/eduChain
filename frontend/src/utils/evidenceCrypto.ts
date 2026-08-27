import {
  ethers,
  type Signer,
} from "ethers";

import type {
  CanonicalEvidence,
  EvidenceInput,
} from "../types/evidence";

/**
 * Normalize insignificant whitespace.
 */
function normalizeString(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Convert evidence into a deterministic structure.
 *
 * IMPORTANT:
 * - Fixed property order
 * - Normalized strings
 * - Sorted skills
 * - Explicit empty repository
 * - Explicit empty repositoryCommit
 */
export function canonicalizeEvidence(
  evidence: EvidenceInput,
): CanonicalEvidence {
  const normalizedSkills =
    evidence.skills
      .map((skill) =>
        normalizeString(skill),
      )
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b),
      );

  return {
    type: evidence.type,

    title: normalizeString(
      evidence.title,
    ),

    description:
      normalizeString(
        evidence.description,
      ),

    owner:
      evidence.owner
        .trim()
        .toLowerCase(),

    repository:
      normalizeString(
        evidence.repository ?? "",
      ),

    repositoryCommit:
      normalizeString(
        evidence.repositoryCommit ??
          "",
      ).toLowerCase(),

    skills:
      normalizedSkills,

    timestamp:
      Math.floor(
        evidence.timestamp,
      ),
  };
}

/**
 * Deterministic serialization.
 *
 * Never use JSON.stringify(evidence)
 * directly elsewhere.
 */
export function serializeEvidence(
  evidence: EvidenceInput,
): string {
  const canonical =
    canonicalizeEvidence(
      evidence,
    );

  return JSON.stringify([
    [
      "type",
      canonical.type,
    ],

    [
      "title",
      canonical.title,
    ],

    [
      "description",
      canonical.description,
    ],

    [
      "owner",
      canonical.owner,
    ],

    [
      "repository",
      canonical.repository,
    ],

    [
      "repositoryCommit",
      canonical.repositoryCommit,
    ],

    [
      "skills",
      canonical.skills,
    ],

    [
      "timestamp",
      canonical.timestamp,
    ],
  ]);
}

/**
 * Generate Keccak-256 evidence commitment.
 */
export function hashEvidence(
  evidence: EvidenceInput,
): string {
  const serialized =
    serializeEvidence(
      evidence,
    );

  return ethers.keccak256(
    ethers.toUtf8Bytes(
      serialized,
    ),
  );
}

/**
 * Sign the exact evidence hash.
 */
export async function signEvidence(
  signer: Signer,
  evidenceHash: string,
): Promise<string> {
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

  return signer.signMessage(
    evidenceHash,
  );
}

/**
 * Recover signer from evidence signature.
 */
export function recoverEvidenceSigner(
  evidenceHash: string,
  signature: string,
): string {
  if (
    !ethers.isHexString(
      evidenceHash,
      32,
    )
  ) {
    throw new Error(
      "Invalid evidence hash.",
    );
  }

  if (
    !ethers.isHexString(
      signature,
    )
  ) {
    throw new Error(
      "Invalid evidence signature.",
    );
  }

  return ethers.verifyMessage(
    evidenceHash,
    signature,
  );
}

/**
 * Verify evidence signature against expected owner.
 */
export function verifyEvidenceSignature(
  evidenceHash: string,
  signature: string,
  expectedOwner: string,
): boolean {
  try {
    const recovered =
      recoverEvidenceSigner(
        evidenceHash,
        signature,
      );

    return (
      recovered.toLowerCase() ===
      expectedOwner.toLowerCase()
    );
  } catch {
    return false;
  }
}