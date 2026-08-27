import type {
  AchievementCriterion,
  AchievementCriterionResult,
  AchievementInput,
  AchievementProof,
  AchievementStatus,
  EvidenceGraph,
  AchievementEvidenceNode,
  StoredAchievement,
} from "../types/achievement";

import type {
  StoredEvidence,
} from "../types/evidence";

import {
  getStoredEvidenceById,
} from "./evidenceService";

import {
  buildMerkleTree,
  createMerkleProof,
  verifyEvidenceMerkleProof,
  verifyMerkleTree,
} from "../utils/merkle";

import {
  anchorAchievement,
  createAchievementId,
  verifyAchievement,
  verifyAchievementMerkleRoot,
  verifyAchievementOwner,
  type AchievementBlockchainRecord,
} from "./achievementRegistry";

const STORAGE_KEY =
  "eduproof:achievements:v1";

/* =====================================================
   NORMALIZATION
   ===================================================== */

function normalize(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeLower(
  value: string,
): string {
  return normalize(value)
    .toLowerCase();
}

/* =====================================================
   READ LOCAL ACHIEVEMENTS
   ===================================================== */

function readAchievements():
  StoredAchievement[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as StoredAchievement[];
  } catch (error) {
    console.error(
      "Unable to read achievements:",
      error,
    );

    return [];
  }
}

/* =====================================================
   WRITE LOCAL ACHIEVEMENTS
   ===================================================== */

function writeAchievements(
  achievements: StoredAchievement[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      achievements,
    ),
  );
}

/* =====================================================
   GET ALL
   ===================================================== */

export function getStoredAchievements():
  StoredAchievement[] {
  return readAchievements();
}

/* =====================================================
   GET BY ID
   ===================================================== */

export function getStoredAchievementById(
  id: string,
): StoredAchievement | null {
  return (
    readAchievements().find(
      (item) =>
        item.id === id,
    ) ?? null
  );
}

/* =====================================================
   GET BY OWNER
   ===================================================== */

export function getAchievementsByOwner(
  owner: string,
): StoredAchievement[] {
  const normalizedOwner =
    owner
      .trim()
      .toLowerCase();

  return readAchievements().filter(
    (item) =>
      item.achievement.owner
        .toLowerCase() ===
      normalizedOwner,
  );
}

/* =====================================================
   DELETE
   ===================================================== */

export function deleteStoredAchievement(
  id: string,
): void {
  const achievements =
    readAchievements();

  writeAchievements(
    achievements.filter(
      (item) =>
        item.id !== id,
    ),
  );
}

/* =====================================================
   CLEAR
   ===================================================== */

export function clearStoredAchievements():
  void {
  localStorage.removeItem(
    STORAGE_KEY,
  );
}

/* =====================================================
   LOAD EVIDENCE
   ===================================================== */

export function getAchievementEvidence(
  evidenceIds: string[],
): StoredEvidence[] {
  return evidenceIds
    .map(
      (id) =>
        getStoredEvidenceById(id),
    )
    .filter(
      (
        evidence,
      ): evidence is StoredEvidence =>
        evidence !== null,
    );
}

/* =====================================================
   CRITERION EVALUATION
   ===================================================== */

function evaluateCriterion(
  criterion: AchievementCriterion,
  evidence: StoredEvidence[],
): AchievementCriterionResult {
  switch (criterion.type) {
    /* -------------------------------------------------
       MINIMUM EVIDENCE COUNT
       ------------------------------------------------- */

    case "MIN_EVIDENCE_COUNT": {
      const minimum =
        Math.max(
          1,
          criterion.minimumCount ?? 1,
        );

      const actual =
        evidence.length;

      const passed =
        actual >= minimum;

      return {
        criterion,
        passed,
        actualValue: actual,
        explanation: passed
          ? `${actual} evidence record(s) satisfy the minimum of ${minimum}.`
          : `Only ${actual} evidence record(s) found. At least ${minimum} required.`,
      };
    }

    /* -------------------------------------------------
       REQUIRED EVIDENCE TYPE
       ------------------------------------------------- */

    case "REQUIRED_EVIDENCE_TYPE": {
      const requiredType =
        criterion.evidenceType;

      if (!requiredType) {
        return {
          criterion,
          passed: false,
          actualValue: false,
          explanation:
            "No required evidence type was configured.",
        };
      }

      const matching =
        evidence.some(
          (item) =>
            item.evidence.type ===
            requiredType,
        );

      return {
        criterion,
        passed: matching,
        actualValue: matching,
        explanation: matching
          ? `Required ${requiredType} evidence is present.`
          : `No ${requiredType} evidence was found.`,
      };
    }

    /* -------------------------------------------------
       REQUIRED SKILL
       ------------------------------------------------- */

    case "REQUIRED_SKILL": {
      const requiredSkill =
        criterion.skill
          ? normalizeLower(
              criterion.skill,
            )
          : "";

      if (!requiredSkill) {
        return {
          criterion,
          passed: false,
          actualValue: false,
          explanation:
            "No required skill was configured.",
        };
      }

      const hasSkill =
        evidence.some(
          (item) =>
            item.evidence.skills.some(
              (skill) =>
                normalizeLower(
                  skill,
                ) ===
                requiredSkill,
            ),
        );

      return {
        criterion,
        passed: hasSkill,
        actualValue: hasSkill,
        explanation: hasSkill
          ? `Required skill "${criterion.skill}" is demonstrated by the evidence.`
          : `Required skill "${criterion.skill}" was not found in the evidence.`,
      };
    }

    /* -------------------------------------------------
       REQUIRED GITHUB EVIDENCE
       ------------------------------------------------- */

    case "REQUIRED_GITHUB_EVIDENCE": {
      const hasGitHubEvidence =
        evidence.some(
          (item) =>
            Boolean(
              item.evidence.repository,
            ) &&
            Boolean(
              item.evidence.repositoryCommit,
            ),
        );

      return {
        criterion,
        passed:
          hasGitHubEvidence,
        actualValue:
          hasGitHubEvidence,
        explanation:
          hasGitHubEvidence
            ? "GitHub repository evidence with a specific commit is present."
            : "No GitHub repository evidence with a specific commit was found.",
      };
    }

    /* -------------------------------------------------
       REQUIRED VERIFIED EVIDENCE
       ------------------------------------------------- */

    case "REQUIRED_VERIFIED_EVIDENCE": {
      const verifiedCount =
        evidence.filter(
          (item) =>
            item.status ===
              "ANCHORED" &&
            Boolean(
              item.ownerVerified,
            ),
        ).length;

      const passed =
        verifiedCount > 0;

      return {
        criterion,
        passed,
        actualValue:
          verifiedCount,
        explanation: passed
          ? `${verifiedCount} cryptographically verified evidence record(s) found.`
          : "No anchored evidence with a verified owner signature was found.",
      };
    }

    default:
      return {
        criterion,
        passed: false,
        actualValue: false,
        explanation:
          "Unsupported achievement criterion.",
      };
  }
}

/* =====================================================
   EVALUATE ALL CRITERIA
   ===================================================== */

export function evaluateAchievementCriteria(
  criteria: AchievementCriterion[],
  evidence: StoredEvidence[],
): AchievementCriterionResult[] {
  return criteria.map(
    (criterion) =>
      evaluateCriterion(
        criterion,
        evidence,
      ),
  );
}

/* =====================================================
   BUILD ACHIEVEMENT
   ===================================================== */

export function createAchievementProof(
  input: AchievementInput,
  evidenceIds: string[],
): AchievementProof {
  if (
    !input.owner ||
    !/^0x[a-fA-F0-9]{40}$/.test(
      input.owner,
    )
  ) {
    throw new Error(
      "A valid student wallet address is required.",
    );
  }

  if (
    !normalize(input.title)
  ) {
    throw new Error(
      "Achievement title is required.",
    );
  }

  if (
    evidenceIds.length === 0
  ) {
    throw new Error(
      "Select at least one evidence record.",
    );
  }

  const evidence =
    getAchievementEvidence(
      evidenceIds,
    );

  if (
    evidence.length !==
    evidenceIds.length
  ) {
    throw new Error(
      "One or more selected evidence records could not be found.",
    );
  }

  const normalizedInput:
    AchievementInput = {
    owner:
      input.owner
        .trim()
        .toLowerCase(),

    title:
      normalize(
        input.title,
      ),

    description:
      normalize(
        input.description,
      ),

    skills:
      Array.from(
        new Set(
          input.skills
            .map(normalize)
            .filter(Boolean),
        ),
      ).sort(),

    criteria:
      input.criteria,
  };

  const evidenceHashes =
    evidence.map(
      (item) =>
        item.evidenceHash,
    );

  const criterionResults =
    evaluateAchievementCriteria(
      normalizedInput.criteria,
      evidence,
    );

  const qualified =
    criterionResults.length > 0 &&
    criterionResults.every(
      (result) =>
        result.passed,
    );

  const now =
    Date.now();

  const status:
    AchievementStatus =
    qualified
      ? "ACHIEVED"
      : "EVIDENCE_COLLECTING";

  return {
    achievement:
      normalizedInput,

    evidenceIds:
      [...evidenceIds],

    evidenceHashes:
      [...evidenceHashes],

    criterionResults,

    qualified,

    status,

    createdAt: now,

    updatedAt: now,
  };
}

/* =====================================================
   BACKWARD COMPATIBILITY
   ===================================================== */

/*
 * EvidenceTest.tsx currently imports createAchievement.
 *
 * Keep createAchievement as the public API while using
 * createAchievementProof internally.
 */
// export function createAchievement(
//   input: AchievementInput,
//   evidenceIds: string[],
// ): AchievementProof {
//   return createAchievementProof(
//     input,
//     evidenceIds,
//   );
// }

/* =====================================================
   LEGACY / UI COMPATIBILITY
   ===================================================== */

/**
 * Creates and stores an achievement in one operation.
 *
 * EvidenceTest.tsx uses this convenience API:
 *
 * createAchievement(
 *   input,
 *   evidenceIds,
 *   evidenceHashes,
 *   criterionResults
 * )
 *
 * The newer architecture does not need callers to provide
 * evidenceHashes or criterionResults because both values
 * are derived from the selected evidence and criteria.
 *
 * The extra arguments are therefore accepted for backward
 * compatibility but deliberately ignored.
 */
export function createAchievement(
  input: AchievementInput,
  evidenceIds: string[],
  _evidenceHashes?: string[],
  _criterionResults?: AchievementCriterionResult[],
): StoredAchievement {
  const proof =
    createAchievementProof(
      input,
      evidenceIds,
    );

  return saveAchievement(
    proof,
  );
}

/* =====================================================
   SAVE ACHIEVEMENT
   ===================================================== */

export function saveAchievement(
  proof: AchievementProof,
): StoredAchievement {
  const evidenceHashes =
    proof.evidenceHashes;

  if (
    evidenceHashes.length === 0
  ) {
    throw new Error(
      "Cannot save an achievement without evidence.",
    );
  }

  const merkleRoot =
    buildMerkleTree(
      evidenceHashes,
    ).root;

  const id =
    createAchievementId(
      proof.achievement.owner,
      evidenceHashes,
    );

  const stored:
    StoredAchievement = {
    ...proof,

    id,

    merkleRoot,

    updatedAt:
      Date.now(),
  };

  const existing =
    readAchievements();

  const existingIndex =
    existing.findIndex(
      (item) =>
        item.id === id,
    );

  if (
    existingIndex >= 0
  ) {
    existing[
      existingIndex
    ] = stored;
  } else {
    existing.unshift(
      stored,
    );
  }

  writeAchievements(
    existing,
  );

  return stored;
}

/* =====================================================
   UPDATE ACHIEVEMENT
   ===================================================== */

export function updateStoredAchievement(
  achievement: StoredAchievement,
): StoredAchievement {
  const existing =
    readAchievements();

  const updated:
    StoredAchievement = {
    ...achievement,
    updatedAt:
      Date.now(),
  };

  const index =
    existing.findIndex(
      (item) =>
        item.id ===
        achievement.id,
    );

  if (index === -1) {
    existing.unshift(
      updated,
    );
  } else {
    existing[index] =
      updated;
  }

  writeAchievements(
    existing,
  );

  return updated;
}

/* =====================================================
   BUILD EVIDENCE GRAPH
   ===================================================== */

export function buildEvidenceGraph(
  achievement:
    StoredAchievement,
): EvidenceGraph {
  const evidence =
    getAchievementEvidence(
      achievement.evidenceIds,
    );

  const nodes:
    AchievementEvidenceNode[] =
    evidence.map(
      (item) => ({
        evidenceId:
          item.id,

        evidenceHash:
          item.evidenceHash,

        type:
          item.evidence.type,

        title:
          item.evidence.title,

        owner:
          item.evidence.owner,

        status:
          item.status,

        skills:
          item.evidence.skills,

        repository:
          item.evidence.repository,

        repositoryCommit:
          item.evidence
            .repositoryCommit,

        evidence:
          item,
      }),
    );

  const verifiedEvidence =
    nodes.filter(
      (node) =>
        node.status ===
        "ANCHORED",
    ).length;

  const revokedEvidence =
    nodes.filter(
      (node) =>
        node.status ===
        "REVOKED",
    ).length;

  const skills =
    Array.from(
      new Set(
        nodes.flatMap(
          (node) =>
            node.skills,
        ),
      ),
    ).sort();

  return {
    achievementId:
      achievement.id,

    owner:
      achievement.achievement
        .owner,

    nodes,

    evidenceHashes:
      nodes.map(
        (node) =>
          node.evidenceHash,
      ),

    totalEvidence:
      nodes.length,

    verifiedEvidence,

    revokedEvidence,

    skills,
  };
}

/* =====================================================
   MERKLE PROOF FOR EVIDENCE
   ===================================================== */

export function getAchievementEvidenceProof(
  achievement:
    StoredAchievement,
  evidenceHash: string,
) {
  return createMerkleProof(
    achievement.evidenceHashes,
    evidenceHash,
  );
}

/* =====================================================
   VERIFY LOCAL MERKLE TREE
   ===================================================== */

export function verifyAchievementMerkleTree(
  achievement:
    StoredAchievement,
): boolean {
  if (
    !achievement.merkleRoot
  ) {
    return false;
  }

  return verifyMerkleTree(
    achievement.evidenceHashes,
    achievement.merkleRoot,
  );
}

/* =====================================================
   VERIFY ONE EVIDENCE
   ===================================================== */

export function verifyAchievementEvidence(
  achievement:
    StoredAchievement,
  evidenceHash: string,
): boolean {
  if (
    !achievement.merkleRoot
  ) {
    return false;
  }

  const proof =
    createMerkleProof(
      achievement.evidenceHashes,
      evidenceHash,
    );

  return verifyEvidenceMerkleProof(
    evidenceHash,
    proof,
  );
}

/* =====================================================
   ANCHOR
   ===================================================== */

export async function anchorStoredAchievement(
  achievement:
    StoredAchievement,
): Promise<StoredAchievement> {
  if (
    !achievement.qualified
  ) {
    throw new Error(
      "Achievement does not currently satisfy all criteria.",
    );
  }

  if (
    !achievement.merkleRoot
  ) {
    throw new Error(
      "Achievement Merkle root is missing.",
    );
  }

  const calculatedRoot =
    buildMerkleTree(
      achievement.evidenceHashes,
    ).root;

  if (
    calculatedRoot.toLowerCase() !==
    achievement.merkleRoot.toLowerCase()
  ) {
    throw new Error(
      "Achievement Merkle root is invalid.",
    );
  }

  const result =
    await anchorAchievement(
      achievement.id,
      achievement.merkleRoot,
    );

  const updated:
    StoredAchievement = {
    ...achievement,

    status:
      "ACHIEVED",

    anchorTransactionHash:
      result.transactionHash,

    anchorBlockNumber:
      result.blockNumber,

    updatedAt:
      Date.now(),
  };

  return updateStoredAchievement(
    updated,
  );
}

/* =====================================================
   READ BLOCKCHAIN RECORD
   ===================================================== */

export async function getAchievementBlockchainRecord(
  achievementId: string,
): Promise<AchievementBlockchainRecord> {
  return verifyAchievement(
    achievementId,
  );
}

/* =====================================================
   FULL ACHIEVEMENT VERIFICATION
   ===================================================== */

export async function verifyStoredAchievement(
  achievement:
    StoredAchievement,
): Promise<{
  verified: boolean;
  localMerkleValid: boolean;
  blockchainExists: boolean;
  blockchainActive: boolean;
  merkleRootMatches: boolean;
  ownerMatches: boolean;
  blockchain: AchievementBlockchainRecord;
  reason: string;
}> {
  if (
    !achievement.merkleRoot
  ) {
    throw new Error(
      "Achievement has no Merkle root.",
    );
  }

  const localMerkleValid =
    verifyMerkleTree(
      achievement.evidenceHashes,
      achievement.merkleRoot,
    );

  const blockchain =
    await verifyAchievement(
      achievement.id,
    );

  const blockchainExists =
    blockchain.exists;

  const blockchainActive =
    blockchain.status ===
    "ANCHORED";

  const merkleRootMatches =
    blockchainExists &&
    blockchain.merkleRoot
      .toLowerCase() ===
      achievement.merkleRoot
        .toLowerCase();

  const ownerMatches =
    blockchainExists &&
    blockchain.owner
      .toLowerCase() ===
      achievement.achievement.owner
        .toLowerCase();

  const verified =
    localMerkleValid &&
    blockchainExists &&
    blockchainActive &&
    merkleRootMatches &&
    ownerMatches;

  let reason =
    "Achievement verification failed.";

  if (!localMerkleValid) {
    reason =
      "Local evidence hashes do not produce the stored Merkle root.";
  } else if (!blockchainExists) {
    reason =
      "Achievement is not anchored on Ethereum Sepolia.";
  } else if (!blockchainActive) {
    reason =
      "Achievement exists on-chain but is revoked.";
  } else if (!merkleRootMatches) {
    reason =
      "The local Merkle root does not match the blockchain root.";
  } else if (!ownerMatches) {
    reason =
      "The achievement owner does not match the blockchain owner.";
  } else {
    reason =
      "Achievement is cryptographically verified against Ethereum Sepolia.";
  }

  return {
    verified,

    localMerkleValid,

    blockchainExists,

    blockchainActive,

    merkleRootMatches,

    ownerMatches,

    blockchain,

    reason,
  };
}

/* =====================================================
   DIRECT BLOCKCHAIN CHECKS
   ===================================================== */

export async function checkAchievementOnChain(
  achievement:
    StoredAchievement,
): Promise<{
  exists: boolean;
  active: boolean;
  merkleRootMatches: boolean;
  ownerMatches: boolean;
}> {
  if (
    !achievement.merkleRoot
  ) {
    return {
      exists: false,
      active: false,
      merkleRootMatches: false,
      ownerMatches: false,
    };
  }

  const [
    blockchain,
    rootMatches,
    ownerMatches,
  ] = await Promise.all([
    verifyAchievement(
      achievement.id,
    ),

    verifyAchievementMerkleRoot(
      achievement.id,
      achievement.merkleRoot,
    ),

    verifyAchievementOwner(
      achievement.id,
      achievement.achievement.owner,
    ),
  ]);

  return {
    exists:
      blockchain.exists,

    active:
      blockchain.status ===
      "ANCHORED",

    merkleRootMatches:
      rootMatches,

    ownerMatches,
  };
}

/* =====================================================
   REBUILD FROM STUDENT EVIDENCE
   ===================================================== */

export function refreshAchievement(
  achievement:
    StoredAchievement,
): StoredAchievement {
  const evidence =
    getAchievementEvidence(
      achievement.evidenceIds,
    );

  const results =
    evaluateAchievementCriteria(
      achievement
        .achievement.criteria,
      evidence,
    );

  const qualified =
    results.length > 0 &&
    results.every(
      (result) =>
        result.passed,
    );

  const updated:
    StoredAchievement = {
    ...achievement,

    criterionResults:
      results,

    qualified,

    status:
      achievement.status ===
        "REVOKED"
        ? "REVOKED"
        : qualified
          ? "ACHIEVED"
          : "EVIDENCE_COLLECTING",

    updatedAt:
      Date.now(),
  };

  return updateStoredAchievement(
    updated,
  );
}