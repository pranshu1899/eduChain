export type EvidenceType =
  | "PROJECT"
  | "COURSE"
  | "ASSESSMENT"
  | "HACKATHON"
  | "INTERNSHIP"
  | "OPEN_SOURCE"
  | "RESEARCH"
  | "ATTESTATION";

export type EvidenceStatus =
  | "DRAFT"
  | "SIGNED"
  | "ANCHORED"
  | "REVOKED";

export interface EvidenceInput {
  type: EvidenceType;

  title: string;

  description: string;

  owner: string;

  repository?: string;

  /**
   * Specific GitHub commit used as
   * cryptographic project evidence.
   */
  repositoryCommit?: string;

  skills: string[];

  timestamp: number;
}

export interface CanonicalEvidence {
  type: EvidenceType;

  title: string;

  description: string;

  owner: string;

  repository: string;

  /**
   * Specific GitHub commit included
   * in the canonical evidence.
   */
  repositoryCommit: string;

  skills: string[];

  timestamp: number;
}

export interface EvidenceProof {
  evidence: EvidenceInput;

  /**
   * Deterministically serialized evidence.
   */
  canonicalData: string;

  /**
   * Keccak-256 commitment of the
   * canonical evidence.
   */
  evidenceHash: string;

  /**
   * Wallet signature over evidenceHash.
   */
  signature?: string;

  /**
   * Address recovered from signature.
   */
  recoveredSigner?: string;

  /**
   * Whether recoveredSigner matches owner.
   */
  ownerVerified?: boolean;

  status: EvidenceStatus;

  /**
   * Local creation timestamp.
   */
  createdAt: number;
}

/**
 * Persistent record stored by EduProof.
 *
 * Actual evidence remains off-chain.
 *
 * The blockchain-related fields contain
 * only cryptographic proof/anchor information.
 */
export interface StoredEvidence
  extends EvidenceProof {
  /**
   * Local evidence identifier.
   */
  id: string;

  /**
   * Last local modification timestamp.
   */
  updatedAt: number;

  /**
   * Sepolia transaction hash that
   * anchored the evidence commitment.
   */
  anchorTransactionHash?: string;

  /**
   * Sepolia block containing the
   * anchor transaction.
   */
  anchorBlockNumber?: number;
}