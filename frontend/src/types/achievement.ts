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

  /**
   * Used by MIN_EVIDENCE_COUNT.
   */
  minimumCount?: number;

  /**
   * Used by REQUIRED_EVIDENCE_TYPE.
   */
  evidenceType?: EvidenceType;

  /**
   * Used by REQUIRED_SKILL.
   */
  skill?: string;

  /**
   * Optional human-readable explanation.
   */
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
   *
   * This is the student's Ethereum address.
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
   * IDs of the evidence records contributing
   * to this achievement.
   */
  evidenceIds: string[];

  /**
   * Cryptographic hashes of the contributing evidence.
   *
   * These become Merkle tree leaves.
   */
  evidenceHashes: string[];

  /**
   * Criterion evaluation results.
   */
  criterionResults: AchievementCriterionResult[];

  /**
   * Whether all achievement criteria currently pass.
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
   *
   * This is deterministic from:
   * owner + evidence hashes.
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
   ACHIEVEMENT VERIFICATION RESULT
   ===================================================== */

export interface AchievementVerificationResult {
  verified: boolean;

  exists: boolean;

  active: boolean;

  ownerMatches: boolean;

  merkleRootMatches: boolean;

  localMerkleRoot: string;

  onChainMerkleRoot: string;

  achievementId: string;

  owner: string;

  anchoredAt: number;

  status: "NONE" | "ANCHORED" | "REVOKED";

  reason: string;
}