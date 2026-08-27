import type {
  StoredEvidence,
} from "../types/evidence";

import type {
  AchievementCriterion,
  AchievementCriterionResult,
} from "../types/achievement";

/* =====================================================
   NORMALIZATION
   ===================================================== */

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/* =====================================================
   VERIFIED EVIDENCE
   ===================================================== */

/**
 * An evidence item is considered cryptographically
 * verified when:
 *
 * - it has a signature
 * - the owner has been verified
 * - it is anchored on-chain
 * - it is not locally marked revoked
 *
 * The actual blockchain state will be checked by the
 * verification engine later.
 */
export function isEvidenceVerified(
  evidence: StoredEvidence,
): boolean {
  return (
    evidence.status === "ANCHORED" &&
    Boolean(evidence.signature) &&
    evidence.ownerVerified === true
  );
}

/* =====================================================
   GITHUB EVIDENCE
   ===================================================== */

export function isGitHubEvidence(
  evidence: StoredEvidence,
): boolean {
  return (
    evidence.evidence.type === "PROJECT" &&
    Boolean(
      evidence.evidence.repository,
    ) &&
    Boolean(
      evidence.evidence.repositoryCommit,
    )
  );
}

/* =====================================================
   SKILL MATCH
   ===================================================== */

function evidenceContainsSkill(
  evidence: StoredEvidence,
  requiredSkill: string,
): boolean {
  const target = normalize(
    requiredSkill,
  );

  return evidence.evidence.skills.some(
    (skill) =>
      normalize(skill) === target,
  );
}

/* =====================================================
   EVALUATE ONE CRITERION
   ===================================================== */

export function evaluateCriterion(
  criterion: AchievementCriterion,
  evidence: StoredEvidence[],
): AchievementCriterionResult {
  switch (criterion.type) {
    /* ---------------------------------------------
       MINIMUM EVIDENCE COUNT
       --------------------------------------------- */

    case "MIN_EVIDENCE_COUNT": {
      const minimum =
        criterion.minimumCount ?? 1;

      const activeEvidence =
        evidence.filter(
          (item) =>
            item.status !== "REVOKED",
        );

      const actual =
        activeEvidence.length;

      const passed =
        actual >= minimum;

      return {
        criterion,

        passed,

        actualValue: actual,

        explanation: passed
          ? `At least ${minimum} evidence item${
              minimum === 1
                ? ""
                : "s"
            } is present.`
          : `Requires at least ${minimum} evidence item${
              minimum === 1
                ? ""
                : "s"
            }, but only ${actual} ${
              actual === 1
                ? "is"
                : "are"
            } currently available.`,
      };
    }

    /* ---------------------------------------------
       REQUIRED EVIDENCE TYPE
       --------------------------------------------- */

    case "REQUIRED_EVIDENCE_TYPE": {
      if (!criterion.evidenceType) {
        return {
          criterion,

          passed: false,

          actualValue: false,

          explanation:
            "This criterion does not specify an evidence type.",
        };
      }

      const targetType =
        criterion.evidenceType;

      const found =
        evidence.some(
          (item) =>
            item.status !== "REVOKED" &&
            item.evidence.type ===
              targetType,
        );

      return {
        criterion,

        passed: found,

        actualValue: found,

        explanation: found
          ? `Required ${targetType} evidence is present.`
          : `Required ${targetType} evidence has not been provided.`,
      };
    }

    /* ---------------------------------------------
       REQUIRED SKILL
       --------------------------------------------- */

    case "REQUIRED_SKILL": {
      if (!criterion.skill) {
        return {
          criterion,

          passed: false,

          actualValue: false,

          explanation:
            "This criterion does not specify a required skill.",
        };
      }

      const found =
        evidence.some(
          (item) =>
            item.status !== "REVOKED" &&
            evidenceContainsSkill(
              item,
              criterion.skill!,
            ),
        );

      return {
        criterion,

        passed: found,

        actualValue: found,

        explanation: found
          ? `The required skill "${criterion.skill}" is supported by the evidence.`
          : `No active evidence currently supports the skill "${criterion.skill}".`,
      };
    }

    /* ---------------------------------------------
       REQUIRED GITHUB EVIDENCE
       --------------------------------------------- */

    case "REQUIRED_GITHUB_EVIDENCE": {
      const found =
        evidence.some(
          (item) =>
            item.status !== "REVOKED" &&
            isGitHubEvidence(item),
        );

      return {
        criterion,

        passed: found,

        actualValue: found,

        explanation: found
          ? "Verified GitHub project evidence is present."
          : "No GitHub project evidence with a verified commit is present.",
      };
    }

    /* ---------------------------------------------
       REQUIRED VERIFIED EVIDENCE
       --------------------------------------------- */

    case "REQUIRED_VERIFIED_EVIDENCE": {
      const found =
        evidence.some(
          (item) =>
            item.status !== "REVOKED" &&
            isEvidenceVerified(item),
        );

      return {
        criterion,

        passed: found,

        actualValue: found,

        explanation: found
          ? "At least one cryptographically verified evidence item is present."
          : "No cryptographically verified evidence item is currently available.",
      };
    }

    /* ---------------------------------------------
       UNKNOWN CRITERION
       --------------------------------------------- */

    default: {
      return {
        criterion,

        passed: false,

        actualValue: false,

        explanation:
          "Unsupported achievement criterion.",
      };
    }
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
   CHECK QUALIFICATION
   ===================================================== */

export function isAchievementQualified(
  results: AchievementCriterionResult[],
): boolean {
  if (results.length === 0) {
    return false;
  }

  return results.every(
    (result) => result.passed,
  );
}

/* =====================================================
   ACHIEVEMENT PROGRESS
   ===================================================== */

export function calculateAchievementProgress(
  results: AchievementCriterionResult[],
): {
  passed: number;
  total: number;
  percentage: number;
} {
  const total = results.length;

  if (total === 0) {
    return {
      passed: 0,
      total: 0,
      percentage: 0,
    };
  }

  const passed =
    results.filter(
      (result) => result.passed,
    ).length;

  return {
    passed,

    total,

    percentage: Math.round(
      (passed / total) * 100,
    ),
  };
}