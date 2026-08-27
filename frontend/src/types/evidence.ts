// import type {
//   EvidenceStatus,
//   EvidenceType,
//   StoredEvidence,
// } from "./evidence";

/*
 * NOTE:
 * This file is the evidence type model.
 *
 * PROJECT keeps the existing fields:
 * title, description, owner, repository, repositoryCommit,
 * skills and timestamp.
 *
 * COURSE and HACKATHON use the `details` object for
 * type-specific information.
 */

/* =====================================================
 * EVIDENCE TYPE
 * ===================================================== */

export type EvidenceType =
  | "PROJECT"
  | "COURSE"
  | "ASSESSMENT"
  | "HACKATHON"
  | "INTERNSHIP"
  | "OPEN_SOURCE"
  | "RESEARCH"
  | "ATTESTATION";

/* =====================================================
 * EVIDENCE STATUS
 * ===================================================== */

export type EvidenceStatus =
  | "DRAFT"
  | "SIGNED"
  | "ANCHORED"
  | "REVOKED";

/* =====================================================
 * COURSE RESULT
 * ===================================================== */

export interface CourseEvidenceDetails {
  provider?: string;
  instructor?: string;
  completionDate?: string;
  certificateId?: string;
  certificateUrl?: string;
}

/* =====================================================
 * HACKATHON RESULT
 * ===================================================== */

export type HackathonResult =
  | "PARTICIPANT"
  | "FINALIST"
  | "WINNER"
  | "RUNNER_UP"
  | "OTHER";

export interface HackathonEvidenceDetails {
  organizer?: string;
  result?: HackathonResult;
  rank?: number;
  award?: string;
  eventUrl?: string;
}

/* =====================================================
 * TYPE-SPECIFIC DETAILS
 * ===================================================== */

export interface EvidenceDetails
  extends CourseEvidenceDetails,
    HackathonEvidenceDetails {}

/* =====================================================
 * EVIDENCE INPUT
 * ===================================================== */

export interface EvidenceInput {
  type: EvidenceType;

  title: string;

  description: string;

  owner: string;

  /*
   * Used by PROJECT and HACKATHON.
   */
  repository?: string;

  /*
   * Specific GitHub commit used as
   * cryptographic project evidence.
   *
   * Used by PROJECT and HACKATHON.
   */
  repositoryCommit?: string;

  /*
   * Skills demonstrated by this evidence.
   */
  skills: string[];

  /*
   * Unix timestamp representing the
   * evidence date.
   */
  timestamp: number;

  /*
   * Additional information specific to
   * COURSE or HACKATHON.
   *
   * PROJECT does not require this field.
   */
  details?: EvidenceDetails;
}

/* =====================================================
 * CANONICAL EVIDENCE
 * ===================================================== */

export interface CanonicalEvidence {
  type: EvidenceType;

  title: string;

  description: string;

  owner: string;

  repository: string;

  repositoryCommit: string;

  skills: string[];

  timestamp: number;

  /*
   * Canonical type-specific details.
   *
   * Empty values are explicitly represented so
   * serialization remains deterministic.
   */
  details: EvidenceDetails;
}

/* =====================================================
 * EVIDENCE PROOF
 * ===================================================== */

export interface EvidenceProof {
  evidence: EvidenceInput;

  /*
   * Deterministically serialized evidence.
   */
  canonicalData: string;

  /*
   * Keccak-256 commitment of the canonical evidence.
   */
  evidenceHash: string;

  /*
   * Wallet signature over evidenceHash.
   */
  signature?: string;

  /*
   * Address recovered from signature.
   */
  recoveredSigner?: string;

  /*
   * Whether recoveredSigner matches owner.
   */
  ownerVerified?: boolean;

  status: EvidenceStatus;

  /*
   * Local creation timestamp.
   */
  createdAt: number;
}

/* =====================================================
 * STORED EVIDENCE
 * ===================================================== */

export interface StoredEvidence
  extends EvidenceProof {
  /*
   * Local evidence identifier.
   */
  id: string;

  /*
   * Last local modification timestamp.
   */
  updatedAt: number;

  /*
   * Sepolia transaction hash that
   * anchored the evidence commitment.
   */
  anchorTransactionHash?: string;

  /*
   * Sepolia block containing the
   * anchor transaction.
   */
  anchorBlockNumber?: number;
}

/* =====================================================
 * BACKWARD COMPATIBILITY
 * ===================================================== */

/*
 * These helpers allow older Project records to continue
 * working even if they were created before `details`
 * was introduced.
 */

export function getEvidenceDetails(
  evidence: EvidenceInput,
): EvidenceDetails {
  return evidence.details ?? {};
}

/* =====================================================
 * TYPE GUARDS
 * ===================================================== */

export function isProjectEvidence(
  evidence: EvidenceInput,
): boolean {
  return evidence.type === "PROJECT";
}

export function isCourseEvidence(
  evidence: EvidenceInput,
): boolean {
  return evidence.type === "COURSE";
}

export function isHackathonEvidence(
  evidence: EvidenceInput,
): boolean {
  return evidence.type === "HACKATHON";
}