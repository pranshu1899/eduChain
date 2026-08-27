import { ethers } from "ethers";

import type {
  AchievementCriterion,
  AchievementCriterionResult,
  AchievementEvidenceVerification,
  AchievementInput,
  AchievementProof,
  AchievementStatus,
  AchievementVerificationResult,
  EvidenceGraph,
  AchievementEvidenceNode,
  StoredAchievement,
} from "../types/achievement";

import type {
  StoredEvidence,
} from "../types/evidence";

import {
  getStoredEvidence,
  getStoredEvidenceById,
} from "./evidenceService";

import {
  buildMerkleTree,
  createMerkleProof,
  getMerkleRoot,
  verifyEvidenceMerkleProof,
  verifyMerkleProof,
} from "../utils/merkle";

import {
  verifyEvidenceIntegrity,
} from "./evidenceRegistry";

import {
  anchorAchievement,
  verifyAchievementIntegrity,
  revokeAchievementOnChain,
} from "./achievementRegistry";

/* =====================================================
   STORAGE
   ===================================================== */

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
   READ ACHIEVEMENTS
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
   WRITE ACHIEVEMENTS
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
    normalizeLower(owner);

  return readAchievements().filter(
    (item) =>
      normalizeLower(
        item.achievement.owner,
      ) === normalizedOwner,
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
   LOAD ACHIEVEMENT EVIDENCE
   ===================================================== */

/**
 * Existing pages call this with evidenceIds.
 *
 * Keep the API exactly as:
 *
 * getAchievementEvidence(string[])
 */
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
        actualValue:
          actual,

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
        actualValue:
          matching,

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
        passed:
          hasSkill,
        actualValue:
          hasSkill,

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
   CREATE ACHIEVEMENT PROOF
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

    createdAt:
      now,

    updatedAt:
      now,
  };
}

/* =====================================================
   CREATE + SAVE ACHIEVEMENT
   ===================================================== */

/**
 * Compatibility function.
 *
 * Existing EvidenceTest.tsx calls:
 *
 * createAchievement(
 *   input,
 *   evidenceIds,
 *   evidenceHashes,
 *   achievementResults
 * )
 *
 * The last two arguments are accepted so the existing
 * UI does not break. The service derives the canonical
 * values itself from local evidence.
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
  if (
    proof.evidenceHashes.length ===
    0
  ) {
    throw new Error(
      "Cannot save an achievement without evidence.",
    );
  }

  const merkleRoot =
    buildMerkleTree(
      proof.evidenceHashes,
    ).root;

  const id =
    generateAchievementId(
      proof.achievement.owner,
      proof.evidenceHashes,
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
    ] = {
      ...stored,

      createdAt:
        existing[
          existingIndex
        ].createdAt,
    };
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
   UPDATE
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
   GENERATE ACHIEVEMENT ID
   ===================================================== */

export function generateAchievementId(
  owner: string,
  evidenceHashes: string[],
): string {
  const normalizedOwner =
    normalizeLower(owner);

  const normalizedHashes =
    Array.from(
      new Set(
        evidenceHashes.map(
          (hash) =>
            hash.toLowerCase(),
        ),
      ),
    ).sort();

  const payload =
    JSON.stringify([
      normalizedOwner,
      normalizedHashes,
    ]);

  return ethers.keccak256(
    ethers.toUtf8Bytes(
      payload,
    ),
  );
}

/* =====================================================
   BUILD EVIDENCE GRAPH
   ===================================================== */

export function buildEvidenceGraph(
  achievement: StoredAchievement,
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
      achievement.achievement.owner,

    nodes,

    evidenceHashes:
      nodes.map(
        (node) =>
          node.evidenceHash,
      ),

    totalEvidence:
      nodes.length,

    verifiedEvidence:
      nodes.filter(
        (node) =>
          node.status ===
          "ANCHORED",
      ).length,

    revokedEvidence:
      nodes.filter(
        (node) =>
          node.status ===
          "REVOKED",
      ).length,

    skills,
  };
}

/* =====================================================
   MERKLE TREE
   ===================================================== */

export function buildAchievementMerkleTree(
  achievement: StoredAchievement,
) {
  if (
    achievement.evidenceHashes.length ===
    0
  ) {
    throw new Error(
      "Cannot build achievement Merkle tree without evidence.",
    );
  }

  return buildMerkleTree(
    achievement.evidenceHashes,
  );
}

/* =====================================================
   MERKLE ROOT
   ===================================================== */

export function calculateAchievementMerkleRoot(
  achievement: StoredAchievement,
): string {
  return getMerkleRoot(
    achievement.evidenceHashes,
  );
}

/* =====================================================
   MERKLE PROOF
   ===================================================== */

export function createAchievementMerkleProof(
  achievement: StoredAchievement,
  evidenceHash: string,
) {
  return createMerkleProof(
    achievement.evidenceHashes,
    evidenceHash,
  );
}

/* =====================================================
   GET EVIDENCE PROOF
   ===================================================== */

export function getAchievementEvidenceProof(
  achievementOrId:
    | StoredAchievement
    | string,
  evidenceHash: string,
) {
  const achievement =
    typeof achievementOrId ===
    "string"
      ? getStoredAchievementById(
          achievementOrId,
        )
      : achievementOrId;

  if (!achievement) {
    throw new Error(
      "Achievement was not found.",
    );
  }

  return createAchievementMerkleProof(
    achievement,
    evidenceHash,
  );
}

/* =====================================================
   VERIFY MERKLE PROOF
   ===================================================== */

export function verifyAchievementMerkleProof(
  achievement: StoredAchievement,
  evidenceHash: string,
): boolean {
  try {
    const proof =
      createAchievementMerkleProof(
        achievement,
        evidenceHash,
      );

    return verifyEvidenceMerkleProof(
      evidenceHash,
      proof,
    );
  } catch {
    return false;
  }
}

/* =====================================================
   VERIFY MERKLE TREE
   ===================================================== */

export function verifyAchievementMerkleTree(
  achievement: StoredAchievement,
): boolean {
  try {
    if (
      achievement.evidenceHashes.length ===
      0
    ) {
      return false;
    }

    const calculatedRoot =
      getMerkleRoot(
        achievement.evidenceHashes,
      );

    if (
      !achievement.merkleRoot
    ) {
      return true;
    }

    return (
      calculatedRoot.toLowerCase() ===
      achievement.merkleRoot.toLowerCase()
    );
  } catch {
    return false;
  }
}

/* =====================================================
   VERIFY LOCAL ACHIEVEMENT
   ===================================================== */

export function verifyLocalAchievement(
  achievement: StoredAchievement,
): boolean {
  return verifyAchievementMerkleTree(
    achievement,
  );
}

/* =====================================================
   VERIFY ACHIEVEMENT EVIDENCE
   ===================================================== */

export async function verifyAchievementEvidence(
  achievement: StoredAchievement,
  evidenceId: string,
): Promise<AchievementEvidenceVerification> {
  const evidence =
    getStoredEvidence().find(
      (item) =>
        item.id ===
        evidenceId,
    );

  if (!evidence) {
    return {
      evidenceId,

      evidenceHash: "",

      verified: false,

      existsLocally: false,

      onChainExists: false,

      onChainActive: false,

      hashValid: false,

      signatureValid: false,

      ownerMatches: false,

      merkleProofValid: false,

      reason:
        "Evidence does not exist in local storage.",
    };
  }

  const evidenceHash =
    evidence.evidenceHash;

  const hashValid =
    ethers.isHexString(
      evidenceHash,
      32,
    );

  const ownerMatches =
    normalizeLower(
      evidence.evidence.owner,
    ) ===
    normalizeLower(
      achievement.achievement.owner,
    );

  const signatureValid =
    Boolean(
      evidence.signature &&
      evidence.ownerVerified,
    );

  let onChainExists =
    false;

  let onChainActive =
    false;

  let blockchainReason =
    "";

  try {
    const result =
      await verifyEvidenceIntegrity(
        evidenceHash,
        achievement.achievement.owner,
      );

    onChainExists =
      result.exists;

    onChainActive =
      result.active;

    blockchainReason =
      result.reason;
  } catch (error) {
    blockchainReason =
      error instanceof Error
        ? error.message
        : "Unable to verify evidence on-chain.";
  }

  let merkleProofValid =
    false;

  try {
    const proof =
      createAchievementMerkleProof(
        achievement,
        evidenceHash,
      );

    merkleProofValid =
      verifyMerkleProof(
        proof,
      );
  } catch {
    merkleProofValid =
      false;
  }

  const verified =
    hashValid &&
    ownerMatches &&
    signatureValid &&
    merkleProofValid &&
    onChainExists &&
    onChainActive;

  let reason =
    "Evidence verification failed.";

  if (verified) {
    reason =
      "Evidence is locally valid, owner-matched, included in the achievement Merkle tree, and active on-chain.";
  } else if (!hashValid) {
    reason =
      "Evidence hash is invalid.";
  } else if (!ownerMatches) {
    reason =
      "Evidence owner does not match the achievement owner.";
  } else if (!signatureValid) {
    reason =
      "Evidence signature is missing or invalid.";
  } else if (!merkleProofValid) {
    reason =
      "Evidence is not proven to belong to the achievement Merkle tree.";
  } else if (!onChainExists) {
    reason =
      blockchainReason ||
      "Evidence is not anchored on-chain.";
  } else if (!onChainActive) {
    reason =
      blockchainReason ||
      "Evidence exists on-chain but is not active.";
  }

  return {
    evidenceId,

    evidenceHash,

    verified,

    existsLocally: true,

    onChainExists,

    onChainActive,

    hashValid,

    signatureValid,

    ownerMatches,

    merkleProofValid,

    reason,
  };
}

/* =====================================================
   VERIFY ALL EVIDENCE
   ===================================================== */

export async function verifyAchievementEvidenceSet(
  achievement: StoredAchievement,
): Promise<AchievementEvidenceVerification[]> {
  const results:
    AchievementEvidenceVerification[] =
    [];

  for (
    const evidenceId of
    achievement.evidenceIds
  ) {
    results.push(
      await verifyAchievementEvidence(
        achievement,
        evidenceId,
      ),
    );
  }

  return results;
}

/* =====================================================
   VERIFY ACHIEVEMENT
   ===================================================== */

export async function verifyAchievement(
  achievement: StoredAchievement,
  expectedOwner?: string,
): Promise<AchievementVerificationResult> {
  const owner =
    achievement.achievement.owner;

  const ownerMatches =
    expectedOwner
      ? ethers.isAddress(
          expectedOwner,
        ) &&
        owner.toLowerCase() ===
          expectedOwner.toLowerCase()
      : true;

  let localMerkleValid =
    false;

  let localMerkleRoot =
    "";

  try {
    localMerkleRoot =
      getMerkleRoot(
        achievement.evidenceHashes,
      );

    localMerkleValid =
      !achievement.merkleRoot ||
      localMerkleRoot.toLowerCase() ===
        achievement.merkleRoot.toLowerCase();
  } catch {
    localMerkleValid =
      false;
  }

  const evidenceResults =
    await verifyAchievementEvidenceSet(
      achievement,
    );

  const allEvidenceVerified =
    achievement.evidenceIds.length >
      0 &&
    evidenceResults.length ===
      achievement.evidenceIds.length &&
    evidenceResults.every(
      (result) =>
        result.verified,
    );

  let blockchainExists =
    false;

  let blockchainActive =
    false;

  let onChainMerkleRoot =
    "";

  let anchoredAt =
    0;

  let blockchainStatus:
    | "NONE"
    | "ANCHORED"
    | "REVOKED" =
    "NONE";

  try {
    const blockchainResult =
      await verifyAchievementIntegrity(
        achievement.id,
        owner,
        localMerkleRoot,
      );

    blockchainExists =
      blockchainResult.blockchainExists;

    blockchainActive =
      blockchainResult.blockchainActive;

    onChainMerkleRoot =
      blockchainResult.onChainMerkleRoot;

    anchoredAt =
      blockchainResult.anchoredAt;

    blockchainStatus =
      blockchainResult.status;
  } catch {
    blockchainExists =
      false;

    blockchainActive =
      false;
  }

  const merkleRootMatches =
    Boolean(
      achievement.merkleRoot &&
      onChainMerkleRoot &&
      achievement.merkleRoot.toLowerCase() ===
        onChainMerkleRoot.toLowerCase(),
    );

  const verified =
    localMerkleValid &&
    allEvidenceVerified &&
    ownerMatches &&
    blockchainExists &&
    blockchainActive &&
    merkleRootMatches;

  let reason =
    "Achievement verification failed.";

  if (verified) {
    reason =
      "Achievement is fully verified locally and against the blockchain anchor.";
  } else if (!localMerkleValid) {
    reason =
      "Local achievement Merkle root is invalid.";
  } else if (!ownerMatches) {
    reason =
      "Achievement owner does not match the expected owner.";
  } else if (!allEvidenceVerified) {
    reason =
      "One or more achievement evidence items failed verification.";
  } else if (!blockchainExists) {
    reason =
      "Achievement is not anchored on-chain.";
  } else if (!blockchainActive) {
    reason =
      "Achievement exists on-chain but is not active.";
  } else if (!merkleRootMatches) {
    reason =
      "Local Merkle root does not match the blockchain Merkle root.";
  }

  return {
    verified,

    exists:
      blockchainExists,

    active:
      blockchainActive,

    ownerMatches,

    merkleRootMatches,

    localMerkleValid,

    blockchainExists,

    blockchainActive,

    localMerkleRoot,

    onChainMerkleRoot,

    achievementId:
      achievement.id,

    owner,

    anchoredAt,

    status:
      blockchainStatus,

    checks: {
      localMerkleValid,

      blockchainExists,

      blockchainActive,

      merkleRootMatches,

      ownerMatches,
    },

    evidence:
      evidenceResults,

    reason,
  };
}

/* =====================================================
   VERIFY STORED ACHIEVEMENT
   ===================================================== */

export async function verifyStoredAchievement(
  achievement: StoredAchievement,
  expectedOwner?: string,
): Promise<AchievementVerificationResult> {
  return verifyAchievement(
    achievement,
    expectedOwner,
  );
}

/* =====================================================
   ANCHOR STORED ACHIEVEMENT
   ===================================================== */

export async function anchorStoredAchievement(
  achievement: StoredAchievement,
): Promise<StoredAchievement> {
  if (
    achievement.evidenceHashes.length ===
    0
  ) {
    throw new Error(
      "Cannot anchor an achievement without evidence.",
    );
  }

  if (
    !achievement.qualified
  ) {
    throw new Error(
      "Achievement does not currently satisfy all criteria.",
    );
  }

  if (
    achievement.status ===
    "REVOKED"
  ) {
    throw new Error(
      "A revoked achievement cannot be anchored.",
    );
  }

  const merkleRoot =
    getMerkleRoot(
      achievement.evidenceHashes,
    );

  const result =
    await anchorAchievement(
      achievement.id,
      merkleRoot,
    );

  const updated:
    StoredAchievement = {
    ...achievement,

    merkleRoot,

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
   REVOKE STORED ACHIEVEMENT
   ===================================================== */

export async function revokeStoredAchievement(
  achievement: StoredAchievement,
): Promise<StoredAchievement> {
  const result =
    await revokeAchievementOnChain(
      achievement.id,
    );

  const updated:
    StoredAchievement = {
    ...achievement,

    status:
      "REVOKED",

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
   SUMMARY
   ===================================================== */

export function getAchievementSummary(
  achievement: StoredAchievement,
): {
  evidenceCount: number;
  verifiedEvidence: number;
  revokedEvidence: number;
  qualified: boolean;
  status: AchievementStatus;
  merkleRoot: string;
} {
  const graph =
    buildEvidenceGraph(
      achievement,
    );

  return {
    evidenceCount:
      graph.totalEvidence,

    verifiedEvidence:
      graph.verifiedEvidence,

    revokedEvidence:
      graph.revokedEvidence,

    qualified:
      achievement.qualified,

    status:
      achievement.status,

    merkleRoot:
      achievement.merkleRoot ??
      "",
  };
}