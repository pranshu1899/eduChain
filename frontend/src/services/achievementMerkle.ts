import type {
  StoredAchievement,
} from "../types/achievement";

import type {
  StoredEvidence,
} from "../types/evidence";

import {
  buildMerkleTree,
  createMerkleProof,
  verifyEvidenceMerkleProof,
  getMerkleTreeSummary,
  type MerkleProof,
} from "../utils/merkle";

/* =====================================================
   BUILD ACHIEVEMENT MERKLE TREE
   ===================================================== */

export function buildAchievementMerkleTree(
  achievement: StoredAchievement,
) {
  if (
    achievement.evidenceHashes.length === 0
  ) {
    throw new Error(
      "Achievement has no evidence hashes.",
    );
  }

  return buildMerkleTree(
    achievement.evidenceHashes,
  );
}

/* =====================================================
   GET ACHIEVEMENT MERKLE ROOT
   ===================================================== */

export function getAchievementMerkleRoot(
  achievement: StoredAchievement,
): string {
  return buildAchievementMerkleTree(
    achievement,
  ).root;
}

/* =====================================================
   CREATE EVIDENCE PROOF
   ===================================================== */

export function createAchievementEvidenceProof(
  achievement: StoredAchievement,
  evidenceHash: string,
): MerkleProof {
  return createMerkleProof(
    achievement.evidenceHashes,
    evidenceHash,
  );
}

/* =====================================================
   VERIFY EVIDENCE AGAINST ACHIEVEMENT
   ===================================================== */

export function verifyEvidenceInAchievement(
  achievement: StoredAchievement,
  evidenceHash: string,
  proof?: MerkleProof,
): boolean {
  if (!proof) {
    try {
      proof =
        createAchievementEvidenceProof(
          achievement,
          evidenceHash,
        );
    } catch {
      return false;
    }
  }

  return verifyEvidenceMerkleProof(
    evidenceHash,
    proof,
  );
}

/* =====================================================
   ACHIEVEMENT MERKLE SUMMARY
   ===================================================== */

export function getAchievementMerkleSummary(
  achievement: StoredAchievement,
) {
  return getMerkleTreeSummary(
    achievement.evidenceHashes,
  );
}

/* =====================================================
   REBUILD ACHIEVEMENT HASH SET
   ===================================================== */

/**
 * Builds the Merkle tree from the evidence currently
 * attached to the achievement.
 *
 * This is useful after evidence is added or revoked.
 */
export function rebuildAchievementMerkleTree(
  achievement: StoredAchievement,
  evidence: StoredEvidence[],
) {
  const owner =
    achievement.achievement.owner
      .trim()
      .toLowerCase();

  const ownerEvidence =
    evidence.filter(
      (item) =>
        item.evidence.owner
          .trim()
          .toLowerCase() ===
        owner,
    );

  const evidenceHashes =
    ownerEvidence.map(
      (item) =>
        item.evidenceHash,
    );

  if (
    evidenceHashes.length === 0
  ) {
    throw new Error(
      "No evidence is available for this achievement.",
    );
  }

  return buildMerkleTree(
    evidenceHashes,
  );
}