import {
  ethers,
  type Signer,
} from "ethers";

import type {
  CanonicalEvidence,
  EvidenceDetails,
  EvidenceInput,
} from "../types/evidence";

/* =====================================================
 * NORMALIZE STRING
 * ===================================================== */

function normalizeString(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

/* =====================================================
 * NORMALIZE OPTIONAL STRING
 * ===================================================== */

function normalizeOptionalString(
  value?: string,
): string {
  return normalizeString(value ?? "");
}

/* =====================================================
 * NORMALIZE DETAILS
 * ===================================================== */

/**
 * Converts type-specific evidence details into a
 * deterministic structure.
 *
 * COURSE fields:
 * - provider
 * - instructor
 * - completionDate
 * - certificateId
 * - certificateUrl
 *
 * HACKATHON fields:
 * - organizer
 * - result
 * - rank
 * - award
 * - eventUrl
 *
 * Empty values are explicitly represented so that
 * the serialized evidence remains deterministic.
 */
function canonicalizeDetails(
  evidence: EvidenceInput,
): EvidenceDetails {
  const details = evidence.details ?? {};

  const canonical: EvidenceDetails = {
    provider:
      normalizeOptionalString(
        details.provider,
      ),

    instructor:
      normalizeOptionalString(
        details.instructor,
      ),

    completionDate:
      normalizeOptionalString(
        details.completionDate,
      ),

    certificateId:
      normalizeOptionalString(
        details.certificateId,
      ),

    certificateUrl:
      normalizeOptionalString(
        details.certificateUrl,
      ),

    organizer:
      normalizeOptionalString(
        details.organizer,
      ),

    result:
      details.result ?? undefined,

    rank:
      typeof details.rank === "number" &&
      Number.isFinite(details.rank)
        ? Math.floor(details.rank)
        : undefined,

    award:
      normalizeOptionalString(
        details.award,
      ),

    eventUrl:
      normalizeOptionalString(
        details.eventUrl,
      ),
  };

  /*
   * Do not allow irrelevant type-specific data to
   * accidentally become part of another evidence type.
   */

  if (evidence.type === "COURSE") {
    return {
      provider: canonical.provider,
      instructor: canonical.instructor,
      completionDate:
        canonical.completionDate,
      certificateId:
        canonical.certificateId,
      certificateUrl:
        canonical.certificateUrl,

      organizer: "",
      result: undefined,
      rank: undefined,
      award: "",
      eventUrl: "",
    };
  }

  if (evidence.type === "HACKATHON") {
    return {
      provider: "",
      instructor: "",
      completionDate: "",
      certificateId: "",
      certificateUrl: "",

      organizer: canonical.organizer,
      result: canonical.result,
      rank: canonical.rank,
      award: canonical.award,
      eventUrl: canonical.eventUrl,
    };
  }

  /*
   * PROJECT and other evidence types don't require
   * type-specific details.
   */
  return {
    provider: "",
    instructor: "",
    completionDate: "",
    certificateId: "",
    certificateUrl: "",

    organizer: "",
    result: undefined,
    rank: undefined,
    award: "",
    eventUrl: "",
  };
}

/* =====================================================
 * CANONICALIZE EVIDENCE
 * ===================================================== */

/**
 * Convert evidence into a deterministic structure.
 *
 * IMPORTANT:
 * - Fixed property order
 * - Normalized strings
 * - Lowercase owner
 * - Sorted skills
 * - Explicit repository
 * - Explicit repositoryCommit
 * - Explicit type-specific details
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

    title:
      normalizeString(
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

    details:
      canonicalizeDetails(
        evidence,
      ),
  };
}

/* =====================================================
 * SERIALIZE EVIDENCE
 * ===================================================== */

/**
 * Deterministic serialization.
 *
 * NEVER use JSON.stringify(evidence) directly
 * elsewhere for cryptographic hashing.
 *
 * The exact property order is intentionally fixed.
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

    [
      "details",
      [
        [
          "provider",
          canonical.details.provider ?? "",
        ],

        [
          "instructor",
          canonical.details.instructor ?? "",
        ],

        [
          "completionDate",
          canonical.details
            .completionDate ?? "",
        ],

        [
          "certificateId",
          canonical.details
            .certificateId ?? "",
        ],

        [
          "certificateUrl",
          canonical.details
            .certificateUrl ?? "",
        ],

        [
          "organizer",
          canonical.details.organizer ?? "",
        ],

        [
          "result",
          canonical.details.result ?? "",
        ],

        [
          "rank",
          canonical.details.rank ?? null,
        ],

        [
          "award",
          canonical.details.award ?? "",
        ],

        [
          "eventUrl",
          canonical.details.eventUrl ?? "",
        ],
      ],
    ],
  ]);
}

/* =====================================================
 * HASH EVIDENCE
 * ===================================================== */

/**
 * Generate the Keccak-256 evidence commitment.
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

/* =====================================================
 * SIGN EVIDENCE
 * ===================================================== */

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

/* =====================================================
 * RECOVER SIGNER
 * ===================================================== */

/**
 * Recover the wallet address that signed
 * the evidence hash.
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

/* =====================================================
 * VERIFY SIGNATURE
 * ===================================================== */

/**
 * Verify an evidence signature against
 * the expected owner wallet.
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