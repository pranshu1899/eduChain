import type {
  EvidenceStatus,
  EvidenceType,
  StoredEvidence,
} from "./evidence";

/* =====================================================
   ACHIEVEMENT STATUS
   ===================================================== */

export type AchievementStatus =
  | "DRAFT"
  | "EVIDENCE_COLLECTING"
  | "ACHIEVED"
  | "REVOKED";

/* =====================================================
   CRITERION TYPES
   ===================================================== */

export type AchievementCriterionType =
  | "MIN_EVIDENCE_COUNT"
  | "REQUIRED_EVIDENCE_TYPE"
  | "REQUIRED_SKILL"
  | "REQUIRED_GITHUB_EVIDENCE"
  | "REQUIRED_VERIFIED_EVIDENCE";

/* =====================================================
   ACHIEVEMENT CRITERION
   ===================================================== */

export interface AchievementCriterion {
  id: string;
  type: AchievementCriterionType;
  label: string;

  minimumCount?: number;

  evidenceType?: EvidenceType;

  skill?: string;

  description?: string;
}

/* =====================================================
   CRITERION RESULT
   ===================================================== */

export interface AchievementCriterionResult {
  criterion: AchievementCriterion;
  passed: boolean;
  actualValue?: number | string | boolean;
  explanation: string;
}

/* =====================================================
   ACHIEVEMENT INPUT
   ===================================================== */

export interface AchievementInput {
  /**
   * Student / achievement owner wallet.
   */
  owner: string;

  title: string;

  description: string;

  skills: string[];

  criteria: AchievementCriterion[];
}

/* =====================================================
   ACHIEVEMENT PROOF
   ===================================================== */

export interface AchievementProof {
  achievement: AchievementInput;

  /**
   * IDs of evidence records contributing
   * to this achievement.
   */
  evidenceIds: string[];

  /**
   * Cryptographic hashes of contributing evidence.
   */
  evidenceHashes: string[];

  /**
   * Criterion evaluation results.
   */
  criterionResults: AchievementCriterionResult[];

  /**
   * Whether all achievement criteria pass.
   */
  qualified: boolean;

  status: AchievementStatus;

  createdAt: number;

  updatedAt: number;
}

/* =====================================================
   STORED ACHIEVEMENT
   ===================================================== */

export interface StoredAchievement
  extends AchievementProof {
  /**
   * Local achievement identifier.
   */
  id: string;

  /**
   * Merkle root generated from evidence hashes.
   */
  merkleRoot?: string;

  /**
   * Ethereum Sepolia transaction hash.
   */
  anchorTransactionHash?: string;

  /**
   * Ethereum Sepolia block number.
   */
  anchorBlockNumber?: number;
}

/* =====================================================
   EVIDENCE GRAPH NODE
   ===================================================== */

export interface AchievementEvidenceNode {
  evidenceId: string;

  evidenceHash: string;

  type: EvidenceType;

  title: string;

  owner: string;

  status: EvidenceStatus;

  skills: string[];

  repository?: string;

  repositoryCommit?: string;

  /**
   * Reference to the actual local evidence record.
   */
  evidence?: StoredEvidence;
}

/* =====================================================
   EVIDENCE GRAPH
   ===================================================== */

export interface EvidenceGraph {
  achievementId: string;

  /**
   * Student / achievement owner.
   */
  owner: string;

  nodes: AchievementEvidenceNode[];

  evidenceHashes: string[];

  totalEvidence: number;

  verifiedEvidence: number;

  revokedEvidence: number;

  skills: string[];
}

/* =====================================================
   ACHIEVEMENT EVIDENCE VERIFICATION
   ===================================================== */

/**
 * Detailed verification result for one evidence item.
 *
 * These fields intentionally include both the older
 * service-compatible fields and the newer descriptive
 * fields so the existing achievement service and UI
 * remain compatible.
 */
export interface AchievementEvidenceVerification {
  /**
   * Evidence identifier.
   */
  evidenceId: string;

  /**
   * Cryptographic evidence hash.
   */
  evidenceHash: string;

  /**
   * Final verification state for this evidence.
   *
   * This is used directly by achievementService.ts.
   */
  verified: boolean;

  /**
   * Whether the evidence exists locally.
   */
  existsLocally: boolean;

  /**
   * Whether the evidence hash exists on-chain.
   */
  onChainExists: boolean;

  /**
   * Whether the on-chain evidence is active.
   */
  onChainActive: boolean;

  /**
   * Whether the evidence hash is structurally valid.
   */
  hashValid: boolean;

  /**
   * Whether the evidence signature is valid.
   */
  signatureValid: boolean;

  /**
   * Whether the evidence owner matches the
   * expected achievement owner.
   */
  ownerMatches: boolean;

  /**
   * Whether the evidence belongs to the
   * achievement Merkle tree.
   */
  merkleProofValid: boolean;

  /**
   * Human-readable verification explanation.
   */
  reason: string;
}

/* =====================================================
   ACHIEVEMENT VERIFICATION CHECKS
   ===================================================== */

export interface AchievementVerificationChecks {
  /**
   * Whether the local Merkle tree is valid.
   */
  localMerkleValid: boolean;

  /**
   * Whether the achievement exists on-chain.
   */
  blockchainExists: boolean;

  /**
   * Whether the on-chain achievement is active.
   */
  blockchainActive: boolean;

  /**
   * Whether the local Merkle root matches
   * the on-chain Merkle root.
   */
  merkleRootMatches: boolean;

  /**
   * Whether the achievement owner matches
   * the blockchain owner.
   */
  ownerMatches: boolean;
}

/* =====================================================
   ACHIEVEMENT VERIFICATION RESULT
   ===================================================== */

export interface AchievementVerificationResult {
  /**
   * Final verification result.
   */
  verified: boolean;

  /**
   * Whether the achievement exists.
   */
  exists: boolean;

  /**
   * Whether the achievement is active.
   */
  active: boolean;

  /**
   * Whether the owner matches.
   */
  ownerMatches: boolean;

  /**
   * Whether the local Merkle root matches
   * the blockchain Merkle root.
   */
  merkleRootMatches: boolean;

  /* -------------------------------------------------
     COMPATIBILITY FIELDS
     ------------------------------------------------- */

  /**
   * Whether the locally calculated Merkle
   * structure is valid.
   *
   * Used by StudentAchievementDetails.tsx.
   */
  localMerkleValid: boolean;

  /**
   * Whether the achievement exists on-chain.
   *
   * Used by StudentAchievementDetails.tsx.
   */
  blockchainExists: boolean;

  /**
   * Whether the blockchain achievement is active.
   *
   * Used by StudentAchievementDetails.tsx.
   */
  blockchainActive: boolean;

  /* -------------------------------------------------
     MERKLE
     ------------------------------------------------- */

  /**
   * Locally calculated Merkle root.
   */
  localMerkleRoot: string;

  /**
   * Merkle root retrieved from blockchain.
   */
  onChainMerkleRoot: string;

  /* -------------------------------------------------
     ACHIEVEMENT
     ------------------------------------------------- */

  achievementId: string;

  /**
   * Achievement owner wallet.
   */
  owner: string;

  /**
   * Blockchain anchoring timestamp.
   */
  anchoredAt: number;

  /**
   * Blockchain status.
   */
  status:
    | "NONE"
    | "ANCHORED"
    | "REVOKED";

  /* -------------------------------------------------
     DETAILED CHECKS
     ------------------------------------------------- */

  checks: AchievementVerificationChecks;

  /* -------------------------------------------------
     EVIDENCE
     ------------------------------------------------- */

  /**
   * Per-evidence verification results.
   */
  evidence: AchievementEvidenceVerification[];

  /* -------------------------------------------------
     RESULT
     ------------------------------------------------- */

  /**
   * Human-readable verification explanation.
   */
  reason: string;
}