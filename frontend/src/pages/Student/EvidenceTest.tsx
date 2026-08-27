import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  QRCodeSVG,
} from "qrcode.react";

import StudentLayout from "./StudentLayout";

import {
  createEvidence,
  getConnectedWallet,
  getEvidenceByOwner,
  saveEvidence,
  signEvidenceProof,
} from "../../services/evidenceService";

import {
  anchorEvidence,
  verifyEvidenceIntegrity,
} from "../../services/evidenceRegistry";

import {
  getGitHubIdentity,
  getGitHubSession,
  parseGitHubRepositoryUrl,
  verifyGitHubRepository,
} from "../../services/githubIdentity";

import {
  createAchievement,
  anchorStoredAchievement,
  evaluateAchievementCriteria,
  getStoredAchievements,
} from "../../services/achievementService";

import {
  createAchievementId,
} from "../../services/achievementRegistry";

import {
  buildMerkleTree,
} from "../../utils/achievementMerkle";

import type {
  GitHubIdentity,
  GitHubVerificationResult,
} from "../../services/githubIdentity";

import type {
  EvidenceInput,
  EvidenceProof,
  StoredEvidence,
  EvidenceType,
} from "../../types/evidence";

import type {
  AchievementCriterion,
  AchievementCriterionType,
  StoredAchievement,
} from "../../types/achievement";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface GitHubEvidence {
  repositoryName: string;
  fullName: string;
  owner: string;
  ownerId: number;
  branch: string;
  commitSha: string;
  commitMessage: string;
  commitDate: string;
  repositoryUrl: string;
  commitUrl: string;
}

interface BlockchainVerification {
  verified: boolean;
  exists: boolean;
  ownerMatches: boolean;
  active: boolean;
  owner: string;
  anchoredAt: number;
  status: number;
  reason: string;
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatDateTime(
  timestamp: number,
): string {
  if (!timestamp) {
    return "Not available";
  }

  return new Date(
    timestamp,
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function shortenValue(
  value: string,
  start = 16,
  end = 10,
): string {
  if (!value) {
    return "Not available";
  }

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start,
  )}...${value.slice(-end)}`;
}

function getStatusLabel(
  status: string,
): string {
  switch (status) {
    case "DRAFT":
      return "Draft";

    case "SIGNED":
      return "Signed";

    case "ANCHORED":
      return "Anchored";

    case "REVOKED":
      return "Revoked";

    case "ACHIEVED":
      return "Achieved";

    case "EVIDENCE_COLLECTING":
      return "Evidence Collecting";

    default:
      return status;
  }
}

function getStatusClass(
  status: string,
): string {
  switch (status) {
    case "SIGNED":
    case "ANCHORED":
    case "ACHIEVED":
      return "verified";

    case "REVOKED":
      return "revoked";

    default:
      return "unknown";
  }
}

function getVerificationUrl(
  evidenceHash: string,
): string {
  if (!evidenceHash) {
    return "";
  }

  return `${window.location.origin}/verify?hash=${encodeURIComponent(
    evidenceHash,
  )}`;
}

function getAchievementVerificationUrl(
  achievementId: string,
): string {
  if (!achievementId) {
    return "";
  }

  return `${window.location.origin}/verify-achievement?id=${encodeURIComponent(
    achievementId,
  )}`;
}

function criterionTypeLabel(
  type: AchievementCriterionType,
): string {
  switch (type) {
    case "MIN_EVIDENCE_COUNT":
      return "Minimum evidence count";

    case "REQUIRED_EVIDENCE_TYPE":
      return "Required evidence type";

    case "REQUIRED_SKILL":
      return "Required skill";

    case "REQUIRED_GITHUB_EVIDENCE":
      return "GitHub evidence";

    case "REQUIRED_VERIFIED_EVIDENCE":
      return "Verified evidence";

    default:
      return type;
  }
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function EvidenceTest() {
  const location =
    useLocation();

  /*
   * =======================================================
   * FORM STATE
   * =======================================================
   */

  const [
    evidenceType,
    setEvidenceType,
  ] = useState<EvidenceType>(
    "PROJECT",
  );

  const [
    title,
    setTitle,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    owner,
    setOwner,
  ] = useState("");

  const [
    repository,
    setRepository,
  ] = useState("");

  const [
    repositoryCommit,
    setRepositoryCommit,
  ] = useState("");

  const [
    skillsInput,
    setSkillsInput,
  ] = useState("");

  const [projectTechnologies, setProjectTechnologies] = useState("");
  const [courseProvider, setCourseProvider] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCompletionDate, setCourseCompletionDate] = useState("");
  const [courseCredentialId, setCourseCredentialId] = useState("");
  const [hackathonName, setHackathonName] = useState("");
  const [hackathonOrganizer, setHackathonOrganizer] = useState("");
  const [hackathonDate, setHackathonDate] = useState("");
  const [hackathonResult, setHackathonResult] = useState("");
  const [hackathonTeamSize, setHackathonTeamSize] = useState("");

  const [
    timestamp,
    setTimestamp,
  ] = useState(
    Date.now(),
  );

  /*
   * =======================================================
   * WALLET
   * =======================================================
   */

  const [
    walletAddress,
    setWalletAddress,
  ] = useState("");

  /*
   * =======================================================
   * GITHUB
   * =======================================================
   */

  const [
    githubIdentity,
    setGithubIdentity,
  ] = useState<GitHubIdentity | null>(
    null,
  );

  const [
    githubEvidence,
    setGithubEvidence,
  ] = useState<GitHubEvidence | null>(
    null,
  );

  const [
    githubLoading,
    setGithubLoading,
  ] = useState(false);

  /*
   * =======================================================
   * PROOF
   * =======================================================
   */

  const [
    proof,
    setProof,
  ] = useState<EvidenceProof | null>(
    null,
  );

  /*
   * =======================================================
   * STORED EVIDENCE
   * =======================================================
   */

  const [
    storedEvidence,
    setStoredEvidence,
  ] = useState<
    StoredEvidence[]
  >([]);

  /*
   * =======================================================
   * BLOCKCHAIN
   * =======================================================
   */

  const [
    anchorLoading,
    setAnchorLoading,
  ] = useState(false);

  const [
    anchorResult,
    setAnchorResult,
  ] = useState<{
    transactionHash: string;
    blockNumber: number;
  } | null>(null);

  const [
    blockchainVerification,
    setBlockchainVerification,
  ] = useState<BlockchainVerification | null>(
    null,
  );

  const [
    verifyingBlockchain,
    setVerifyingBlockchain,
  ] = useState(false);

  /*
   * =======================================================
   * ACHIEVEMENT
   * =======================================================
   */

  const [
    selectedEvidenceIds,
    setSelectedEvidenceIds,
  ] = useState<string[]>(
    [],
  );

  const [
    achievementTitle,
    setAchievementTitle,
  ] = useState("");

  const [
    achievementDescription,
    setAchievementDescription,
  ] = useState("");

  const [
    achievementSkills,
    setAchievementSkills,
  ] = useState("");

  const [
    achievementCriteria,
    setAchievementCriteria,
  ] = useState<
    AchievementCriterion[]
  >([]);

  const [
    achievementResults,
    setAchievementResults,
  ] = useState<
    ReturnType<
      typeof evaluateAchievementCriteria
    >
  >([]);

  const [
    currentAchievement,
    setCurrentAchievement,
  ] = useState<
    StoredAchievement | null
  >(null);

  const [
    achievements,
    setAchievements,
  ] = useState<
    StoredAchievement[]
  >([]);

  const [
    achievementLoading,
    setAchievementLoading,
  ] = useState(false);

  const [
    achievementAnchorLoading,
    setAchievementAnchorLoading,
  ] = useState(false);

  const [
    achievementError,
    setAchievementError,
  ] = useState("");

  /*
   * =======================================================
   * UI
   * =======================================================
   */

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /*
   * =======================================================
   * LOAD WALLET
   * =======================================================
   */

  useEffect(() => {
    const loadWallet =
      async () => {
        try {
          const result =
            await getConnectedWallet();

          setWalletAddress(
            result.address,
          );

          setOwner(
            result.address,
          );
        } catch {
          /*
           * Wallet connection happens
           * through StudentLayout.
           */
        }
      };

    void loadWallet();
  }, []);

  /*
   * =======================================================
   * LOAD GITHUB SESSION
   * =======================================================
   */

  useEffect(() => {
    const loadGitHub =
      async () => {
        try {
          if (!getGitHubSession()) {
            return;
          }

          const identity =
            await getGitHubIdentity();

          setGithubIdentity(
            identity,
          );
        } catch (
          githubError
        ) {
          console.error(
            "Unable to restore GitHub identity:",
            githubError,
          );

          setGithubIdentity(
            null,
          );
        }
      };

    void loadGitHub();
  }, [
    location.search,
  ]);

  /*
   * =======================================================
   * LOAD STORED EVIDENCE
   * =======================================================
   */

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    const records =
      getEvidenceByOwner(
        walletAddress,
      );

    setStoredEvidence(
      records,
    );
  }, [
    walletAddress,
    proof,
  ]);

  /*
   * =======================================================
   * LOAD ACHIEVEMENTS
   * =======================================================
   */

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    setAchievements(
      getStoredAchievements().filter(
        (item) =>
          item.achievement.owner.toLowerCase() ===
          walletAddress.toLowerCase(),
      ),
    );
  }, [
    walletAddress,
    currentAchievement,
  ]);

  /*
   * =======================================================
   * SELECTED EVIDENCE
   * =======================================================
   */

  const selectedEvidence =
    useMemo(
      () =>
        storedEvidence.filter(
          (item) =>
            selectedEvidenceIds.includes(
              item.id,
            ),
        ),
      [
        storedEvidence,
        selectedEvidenceIds,
      ],
    );

  /*
   * =======================================================
   * MERKLE PREVIEW
   * =======================================================
   */

  const achievementMerklePreview =
    useMemo(() => {
      if (
        selectedEvidence.length ===
        0
      ) {
        return null;
      }

      try {
        return buildMerkleTree(
          selectedEvidence.map(
            (item) =>
              item.evidenceHash,
          ),
        );
      } catch {
        return null;
      }
    }, [
      selectedEvidence,
    ]);

  /*
   * =======================================================
   * ACHIEVEMENT ID PREVIEW
   * =======================================================
   */

  const achievementIdPreview =
    useMemo(() => {
      if (
        !walletAddress ||
        !achievementMerklePreview
      ) {
        return "";
      }

      try {
        return createAchievementId(
          walletAddress,
          achievementMerklePreview.leaves,
        );
      } catch {
        return "";
      }
    }, [
      walletAddress,
      achievementMerklePreview,
    ]);

  /*
   * =======================================================
   * ACHIEVEMENT QR
   * =======================================================
   */

  const achievementVerificationUrl =
    useMemo(
      () =>
        achievementIdPreview
          ? getAchievementVerificationUrl(
              achievementIdPreview,
            )
          : "",
      [
        achievementIdPreview,
      ],
    );

  /*
   * =======================================================
   * VERIFY GITHUB REPOSITORY
   * =======================================================
   */

  const handleVerifyRepository =
    async () => {
      if (!repository.trim()) {
        setError(
          "Enter a GitHub repository URL first.",
        );

        return;
      }

      if (!githubIdentity) {
        setError(
          "Connect your GitHub account before verifying a repository.",
        );

        return;
      }

      try {
        setGithubLoading(
          true,
        );

        setError("");
        setSuccess("");

        setGithubEvidence(
          null,
        );

        setRepositoryCommit(
          "",
        );

        const {
          owner:
            repositoryOwner,
          repository:
            repositoryName,
        } =
          parseGitHubRepositoryUrl(
            repository,
          );

        const verification:
          GitHubVerificationResult =
          await verifyGitHubRepository(
            repositoryOwner,
            repositoryName,
          );

        if (
          !verification.verified
        ) {
          throw new Error(
            verification.reason ||
              "GitHub repository ownership could not be verified.",
          );
        }

        if (
          !verification.repository
        ) {
          throw new Error(
            "GitHub verification returned no repository information.",
          );
        }

        if (
          !verification.latestCommit
        ) {
          throw new Error(
            "GitHub verification returned no commit information.",
          );
        }

        if (
          verification.repository.ownerId !==
          githubIdentity.id
        ) {
          throw new Error(
            "Security check failed: authenticated GitHub account does not match the repository owner.",
          );
        }

        const repo =
          verification.repository;

        const commit =
          verification.latestCommit;

        const evidence:
          GitHubEvidence = {
          repositoryName:
            repo.name,

          fullName:
            repo.fullName,

          owner:
            repo.owner,

          ownerId:
            repo.ownerId,

          branch:
            repo.defaultBranch,

          commitSha:
            commit.sha,

          commitMessage:
            commit.message,

          commitDate:
            commit.date,

          repositoryUrl:
            repo.url,

          commitUrl:
            commit.url,
        };

        setGithubEvidence(
          evidence,
        );

        setRepositoryCommit(
          evidence.commitSha,
        );

        setRepository(
          evidence.repositoryUrl,
        );

        setProof(
          null,
        );

        setAnchorResult(
          null,
        );

        setBlockchainVerification(
          null,
        );

        setSuccess(
          `GitHub repository verified successfully for @${githubIdentity.login}.`,
        );
      } catch (
        githubError
      ) {
        console.error(
          "GitHub verification failed:",
          githubError,
        );

        setGithubEvidence(
          null,
        );

        setRepositoryCommit(
          "",
        );

        setProof(
          null,
        );

        setError(
          githubError instanceof Error
            ? githubError.message
            : "GitHub repository verification failed.",
        );
      } finally {
        setGithubLoading(
          false,
        );
      }
    };

  /*
   * =======================================================
   * BUILD EVIDENCE
   * =======================================================
   */

  const buildEvidence =
    (): EvidenceInput => {
      if (!walletAddress) throw new Error("Connect your wallet first.");
      if (!title.trim()) throw new Error("Evidence title is required.");
      if (!description.trim()) throw new Error("Evidence description is required.");
      if (!owner.trim()) throw new Error("Evidence owner is required.");
      if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Evidence owner must match the connected wallet.");
      }

      if (evidenceType === "PROJECT") {
        if (!githubIdentity) throw new Error("Connect your GitHub account before creating project evidence.");
        if (!repository.trim()) throw new Error("A GitHub repository is required for project evidence.");
        if (!githubEvidence) throw new Error("Verify the GitHub repository before creating project evidence.");
        if (!repositoryCommit.trim()) throw new Error("A verified GitHub commit is required for project evidence.");
        if (repositoryCommit.toLowerCase() !== githubEvidence.commitSha.toLowerCase()) {
          throw new Error("GitHub commit verification is stale. Verify the repository again.");
        }
        if (githubEvidence.ownerId !== githubIdentity.id) {
          throw new Error("GitHub identity does not match the verified repository owner.");
        }
        if (!projectTechnologies.trim()) throw new Error("Add the technologies used in the project.");
      }

      if (evidenceType === "COURSE") {
        if (!courseProvider.trim()) throw new Error("Course provider or institution is required.");
        if (!courseName.trim()) throw new Error("Course name is required.");
        if (!courseCompletionDate.trim()) throw new Error("Course completion date is required.");
      }

      if (evidenceType === "HACKATHON") {
        if (!hackathonName.trim()) throw new Error("Hackathon name is required.");
        if (!hackathonOrganizer.trim()) throw new Error("Hackathon organizer is required.");
        if (!hackathonDate.trim()) throw new Error("Hackathon date is required.");
        if (!hackathonResult.trim()) throw new Error("Select the hackathon result or participation status.");
      }

      const skills = skillsInput.split(",").map((skill) => skill.trim()).filter(Boolean);

      const details = {
        project: evidenceType === "PROJECT" ? {
          projectName: title.trim(),
          technologies: projectTechnologies.split(",").map((item) => item.trim()).filter(Boolean),
          repository: repository.trim(),
          verifiedCommit: repositoryCommit.trim(),
        } : undefined,
        course: evidenceType === "COURSE" ? {
          provider: courseProvider.trim(),
          courseName: courseName.trim(),
          completionDate: courseCompletionDate,
          credentialId: courseCredentialId.trim() || undefined,
        } : undefined,
        hackathon: evidenceType === "HACKATHON" ? {
          name: hackathonName.trim(),
          organizer: hackathonOrganizer.trim(),
          date: hackathonDate,
          result: hackathonResult.trim(),
          teamSize: hackathonTeamSize.trim() ? Number(hackathonTeamSize) : undefined,
        } : undefined,
      } as EvidenceInput["details"];

      return {
        type: evidenceType,
        title: title.trim(),
        description: description.trim(),
        owner: owner.trim().toLowerCase(),
        repository: evidenceType === "PROJECT" ? repository.trim() || undefined : undefined,
        repositoryCommit: evidenceType === "PROJECT" ? repositoryCommit.trim() || undefined : undefined,
        skills,
        timestamp: Math.floor(timestamp),
        details,
      };
    };

  /*
   * =======================================================
   * CREATE EVIDENCE
   * =======================================================
   */

  const handleCreateEvidence =
    (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      try {
        setError("");
        setSuccess("");

        const input =
          buildEvidence();

        const created =
          createEvidence(
            input,
          );

        setProof(
          created,
        );

        setAnchorResult(
          null,
        );

        setBlockchainVerification(
          null,
        );

        setSuccess(
          "Evidence created successfully. Sign the cryptographic commitment with your wallet.",
        );
      } catch (
        creationError
      ) {
        console.error(
          creationError,
        );

        setError(
          creationError instanceof Error
            ? creationError.message
            : "Unable to create evidence.",
        );
      }
    };

  /*
   * =======================================================
   * SIGN EVIDENCE
   * =======================================================
   */

  const handleSignEvidence =
    async () => {
      if (!proof) {
        setError(
          "Create evidence before signing.",
        );

        return;
      }

      try {
        setError("");
        setSuccess("");

        const signed =
          await signEvidenceProof(
            proof,
          );

        setProof(
          signed,
        );

        const stored =
          saveEvidence(
            signed,
          );

        setStoredEvidence(
          (
            previous,
          ) => [
            stored,
            ...previous.filter(
              (
                item,
              ) =>
                item.id !==
                stored.id,
            ),
          ],
        );

        setSuccess(
          "Evidence signed successfully. It is now ready for Sepolia anchoring.",
        );
      } catch (
        signingError
      ) {
        console.error(
          "Evidence signing failed:",
          signingError,
        );

        setError(
          signingError instanceof Error
            ? signingError.message
            : "Evidence signing failed.",
        );
      }
    };

  /*
   * =======================================================
   * VERIFY BLOCKCHAIN
   * =======================================================
   */

  const verifyCurrentEvidence =
    async (
      hash?: string,
    ) => {
      const evidenceHash =
        hash ||
        proof?.evidenceHash;

      if (!evidenceHash) {
        setError(
          "Create evidence first.",
        );

        return;
      }

      try {
        setVerifyingBlockchain(
          true,
        );

        setError("");
        setSuccess("");

        const result =
          await verifyEvidenceIntegrity(
            evidenceHash,
            proof?.evidence.owner,
          );

        setBlockchainVerification(
          result,
        );

        if (
          result.verified
        ) {
          setSuccess(
            "Cryptographic integrity verified against the Ethereum Sepolia blockchain.",
          );
        } else {
          setError(
            result.reason ||
              "Evidence could not be verified against the blockchain.",
          );
        }
      } catch (
        verificationError
      ) {
        console.error(
          "Blockchain verification failed:",
          verificationError,
        );

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Unable to verify evidence against Sepolia.",
        );
      } finally {
        setVerifyingBlockchain(
          false,
        );
      }
    };

  /*
   * =======================================================
   * ANCHOR EVIDENCE
   * =======================================================
   */

  const handleAnchorEvidence =
    async () => {
      if (!proof) {
        setError(
          "Create evidence first.",
        );

        return;
      }

      if (!proof.signature) {
        setError(
          "Sign the evidence before anchoring it.",
        );

        return;
      }

      try {
        setAnchorLoading(
          true,
        );

        setError("");
        setSuccess("");

        const result =
          await anchorEvidence(
            proof.evidenceHash,
          );

        setAnchorResult(
          result,
        );

        const anchoredProof:
          EvidenceProof = {
          ...proof,
          status:
            "ANCHORED",
        };

        setProof(
          anchoredProof,
        );

        setStoredEvidence(
          (
            previous,
          ) =>
            previous.map(
              (
                item,
              ) =>
                item.evidenceHash ===
                proof.evidenceHash
                  ? {
                      ...item,
                      status:
                        "ANCHORED",
                      anchorTransactionHash:
                        result.transactionHash,
                      anchorBlockNumber:
                        result.blockNumber,
                    }
                  : item,
            ),
        );

        setSuccess(
          "Evidence hash has been anchored on Ethereum Sepolia.",
        );

        await verifyCurrentEvidence(
          proof.evidenceHash,
        );
      } catch (
        anchorError
      ) {
        console.error(
          "Evidence anchoring failed:",
          anchorError,
        );

        setError(
          anchorError instanceof Error
            ? anchorError.message
            : "Unable to anchor evidence on Sepolia.",
        );
      } finally {
        setAnchorLoading(
          false,
        );
      }
    };

  /*
   * =======================================================
   * TOGGLE ACHIEVEMENT EVIDENCE
   * =======================================================
   */

  const toggleEvidenceSelection =
    (
      evidenceId: string,
    ) => {
      setSelectedEvidenceIds(
        (
          current,
        ) =>
          current.includes(
            evidenceId,
          )
            ? current.filter(
                (
                  id,
                ) =>
                  id !==
                  evidenceId,
              )
            : [
                ...current,
                evidenceId,
              ],
      );

      setCurrentAchievement(
        null,
      );

      setAchievementResults(
        [],
      );
    };

  /*
   * =======================================================
   * ADD CRITERION
   * =======================================================
   */

  const addCriterion =
    (
      type: AchievementCriterionType,
    ) => {
      const id =
        `criterion-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;

      const criterion:
        AchievementCriterion = {
        id,
        type,
        label:
          criterionTypeLabel(
            type,
          ),
      };

      if (
        type ===
        "MIN_EVIDENCE_COUNT"
      ) {
        criterion.minimumCount =
          1;
      }

      if (
        type ===
        "REQUIRED_EVIDENCE_TYPE"
      ) {
        criterion.evidenceType =
          "PROJECT";
      }

      if (
        type ===
        "REQUIRED_SKILL"
      ) {
        criterion.skill =
          "";
      }

      setAchievementCriteria(
        (
          current,
        ) => [
          ...current,
          criterion,
        ],
      );
    };

  /*
   * =======================================================
   * REMOVE CRITERION
   * =======================================================
   */

  const removeCriterion =
    (
      id: string,
    ) => {
      setAchievementCriteria(
        (
          current,
        ) =>
          current.filter(
            (
              criterion,
            ) =>
              criterion.id !==
              id,
          ),
      );

      setAchievementResults(
        [],
      );

      setCurrentAchievement(
        null,
      );
    };

  /*
   * =======================================================
   * UPDATE CRITERION
   * =======================================================
   */

  const updateCriterion =
    (
      id: string,
      patch: Partial<AchievementCriterion>,
    ) => {
      setAchievementCriteria(
        (
          current,
        ) =>
          current.map(
            (
              criterion,
            ) =>
              criterion.id ===
              id
                ? {
                    ...criterion,
                    ...patch,
                  }
                : criterion,
          ),
      );

      setAchievementResults(
        [],
      );

      setCurrentAchievement(
        null,
      );
    };

  /*
   * =======================================================
   * EVALUATE ACHIEVEMENT
   * =======================================================
   */

  const handleEvaluateAchievement =
    () => {
      try {
        setAchievementError(
          "",
        );
        setError("");

        if (!walletAddress) {
          throw new Error(
            "Connect your wallet first.",
          );
        }

        if (
          !achievementTitle.trim()
        ) {
          throw new Error(
            "Achievement title is required.",
          );
        }

        if (
          selectedEvidence.length ===
          0
        ) {
          throw new Error(
            "Select at least one evidence record.",
          );
        }

        if (
          achievementCriteria.length ===
          0
        ) {
          throw new Error(
            "Add at least one achievement criterion.",
          );
        }

        const results =
          evaluateAchievementCriteria(
            achievementCriteria,
            selectedEvidence,
          );

        setAchievementResults(
          results,
        );

        const allPassed =
          results.every(
            (
              result,
            ) =>
              result.passed,
          );

        if (allPassed) {
          setSuccess(
            "All achievement criteria passed. The evidence set is ready for Merkle aggregation.",
          );
        } else {
          setError(
            "Some achievement criteria are not satisfied yet.",
          );
        }
      } catch (
        evaluationError
      ) {
        console.error(
          "Achievement evaluation failed:",
          evaluationError,
        );

        setAchievementError(
          evaluationError instanceof Error
            ? evaluationError.message
            : "Unable to evaluate achievement.",
        );
      }
    };

  /*
   * =======================================================
   * CREATE ACHIEVEMENT
   * =======================================================
   */

  const handleCreateAchievement =
    () => {
      try {
        setAchievementLoading(
          true,
        );

        setAchievementError(
          "",
        );

        if (
          achievementResults.length ===
          0
        ) {
          throw new Error(
            "Evaluate the achievement criteria first.",
          );
        }

        if (
          !achievementResults.every(
            (
              result,
            ) =>
              result.passed,
          )
        ) {
          throw new Error(
            "All achievement criteria must pass before creating the proof.",
          );
        }

        if (
          !walletAddress
        ) {
          throw new Error(
            "Connect your wallet first.",
          );
        }

        const skills =
          achievementSkills
            .split(",")
            .map(
              (
                skill,
              ) =>
                skill.trim(),
            )
            .filter(Boolean);

        const input = {
          title:
            achievementTitle.trim(),

          description:
            achievementDescription.trim(),

          owner:
            walletAddress.toLowerCase(),

          skills,

          criteria:
            achievementCriteria,
        };

        const created =
          createAchievement(
            input,
            selectedEvidence.map(
              (
                item,
              ) =>
                item.id,
            ),
            selectedEvidence.map(
              (
                item,
              ) =>
                item.evidenceHash,
            ),
            achievementResults,
          );

        setCurrentAchievement(
          created,
        );

        setAchievements(
          getStoredAchievements().filter(
            (item) =>
              item.achievement.owner.toLowerCase() ===
              walletAddress.toLowerCase(),
          ),
        );

        setSuccess(
          "Proof of Achievement generated locally with a deterministic Merkle root.",
        );
      } catch (
        achievementCreationError
      ) {
        console.error(
          "Achievement creation failed:",
          achievementCreationError,
        );

        setAchievementError(
          achievementCreationError instanceof Error
            ? achievementCreationError.message
            : "Unable to create achievement.",
        );
      } finally {
        setAchievementLoading(
          false,
        );
      }
    };

  /*
   * =======================================================
   * ANCHOR ACHIEVEMENT
   * =======================================================
   */

  const handleAnchorAchievement =
    async () => {
      if (
        !currentAchievement
      ) {
        setAchievementError(
          "Create the achievement proof first.",
        );

        return;
      }

      if (
        !currentAchievement.qualified
      ) {
        setAchievementError(
          "All achievement criteria must pass before anchoring.",
        );

        return;
      }

      try {
        setAchievementAnchorLoading(
          true,
        );

        setAchievementError(
          "",
        );

        const updated =
          await anchorStoredAchievement(
            currentAchievement,
          );

        setCurrentAchievement(
          updated,
        );

        setAchievements(
          getStoredAchievements().filter(
            (item) =>
              item.achievement.owner.toLowerCase() ===
              walletAddress.toLowerCase(),
          ),
        );

        setSuccess(
          "Achievement Merkle root has been anchored on Ethereum Sepolia.",
        );
      } catch (
        achievementAnchorError
      ) {
        console.error(
          "Achievement anchoring failed:",
          achievementAnchorError,
        );

        setAchievementError(
          achievementAnchorError instanceof Error
            ? achievementAnchorError.message
            : "Unable to anchor achievement.",
        );
      } finally {
        setAchievementAnchorLoading(
          false,
        );
      }
    };

  /*
   * =======================================================
   * PUBLIC EVIDENCE QR
   * =======================================================
   */

  const publicVerificationUrl =
    useMemo(
      () =>
        proof
          ? getVerificationUrl(
              proof.evidenceHash,
            )
          : "",
      [
        proof,
        location.pathname,
      ],
    );

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  const resetEvidence =
    () => {
      setTitle("");
      setDescription("");
      setRepository("");
      setRepositoryCommit("");
      setSkillsInput("");

      setGithubEvidence(
        null,
      );

      setProof(
        null,
      );

      setAnchorResult(
        null,
      );

      setBlockchainVerification(
        null,
      );

      setError("");
      setSuccess("");

      setTimestamp(
        Date.now(),
      );
    };

  /*
   * =======================================================
   * RESET ACHIEVEMENT
   * =======================================================
   */

  const resetAchievement =
    () => {
      setSelectedEvidenceIds(
        [],
      );

      setAchievementTitle(
        "",
      );

      setAchievementDescription(
        "",
      );

      setAchievementSkills(
        "",
      );

      setAchievementCriteria(
        [],
      );

      setAchievementResults(
        [],
      );

      setCurrentAchievement(
        null,
      );

      setAchievementError(
        "",
      );
    };

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <StudentLayout
      walletAddress={
        walletAddress
      }
      connected={
        Boolean(walletAddress)
      }
      onConnect={
        async () => {
          try {
            setError("");
            setSuccess("");

            const result =
              await getConnectedWallet();

            setWalletAddress(
              result.address,
            );

            setOwner(
              result.address,
            );

            setSuccess(
              "Wallet connected successfully.",
            );
          } catch (
            connectionError
          ) {
            console.error(
              connectionError,
            );

            setError(
              connectionError instanceof Error
                ? connectionError.message
                : "Unable to connect wallet.",
            );
          }
        }
      }
    >

      <main className="student-main">

        <div className="student-eyebrow">
          PROOF OF ACHIEVEMENT
        </div>

        <h1>
          Create Verifiable Evidence
        </h1>

        <p className="student-description">
          Build cryptographically verifiable evidence
          and combine multiple evidence records into a
          Proof of Achievement.
        </p>

        {error && (
          <div className="student-alert error">

            <strong>
              Action failed
            </strong>

            <span>
              {error}
            </span>

          </div>
        )}

        {success && (
          <div className="student-alert success">

            <strong>
              Success
            </strong>

            <span>
              {success}
            </span>

          </div>
        )}

        {/* =================================================
            01 EVIDENCE DETAILS
            ================================================= */}

        <section className="student-panel">

          <div className="student-panel-header">

            <div>

              <span>
                01 / EVIDENCE DETAILS
              </span>

              <h2>
                {evidenceType === "PROJECT"
                  ? "Document your project"
                  : evidenceType === "COURSE"
                    ? "Document your course"
                    : evidenceType === "HACKATHON"
                      ? "Document your hackathon"
                      : "Describe your evidence"}
              </h2>

              <p>
                {evidenceType === "PROJECT"
                  ? "Project evidence is linked to a verified GitHub repository and commit."
                  : evidenceType === "COURSE"
                    ? "Course evidence records the provider, completion and credential reference."
                    : evidenceType === "HACKATHON"
                      ? "Hackathon evidence records the event, organizer and outcome."
                      : "Evidence is normalized before its cryptographic commitment is generated."}
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleCreateEvidence
            }
            className="student-form"
          >

            <div className="student-form-grid">

              <div className="student-form-field">

                <label>
                  EVIDENCE TYPE
                </label>

                <select
                  value={
                    evidenceType
                  }
                  onChange={(
                    event,
                  ) =>
                    setEvidenceType(
                      event.target.value as EvidenceType,
                    )
                  }
                >

                  <option value="PROJECT">
                    Project
                  </option>

                  <option value="COURSE">
                    Course
                  </option>

                  <option value="ASSESSMENT">
                    Assessment
                  </option>

                  <option value="HACKATHON">
                    Hackathon
                  </option>

                  <option value="INTERNSHIP">
                    Internship
                  </option>

                  <option value="OPEN_SOURCE">
                    Open Source
                  </option>

                  <option value="RESEARCH">
                    Research
                  </option>

                  <option value="ATTESTATION">
                    Attestation
                  </option>

                </select>

              </div>

              <div className="student-form-field">

                <label>
                  TITLE
                </label>

                <input
                  type="text"
                  value={
                    title
                  }
                  onChange={(
                    event,
                  ) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. EduProof Blockchain Project"
                />

              </div>

            </div>

            <div className="student-form-field">

              <label>
                DESCRIPTION
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event,
                ) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe what was achieved, built, researched, or completed..."
                rows={5}
              />

            </div>

            <div className="student-form-grid">

              <div className="student-form-field">

                <label>
                  OWNER WALLET
                </label>

                <input
                  type="text"
                  value={
                    owner
                  }
                  onChange={(
                    event,
                  ) =>
                    setOwner(
                      event.target.value,
                    )
                  }
                  placeholder="0x..."
                  spellCheck={
                    false
                  }
                />

              </div>

              <div className="student-form-field">

                <label>
                  SKILLS
                </label>

                <input
                  type="text"
                  value={
                    skillsInput
                  }
                  onChange={(
                    event,
                  ) =>
                    setSkillsInput(
                      event.target.value,
                    )
                  }
                  placeholder="Solidity, React, Ethereum, TypeScript"
                />

              </div>

            </div>

            <div className="student-form-field">

              <label>
                GITHUB REPOSITORY
              </label>

              <div className="student-input-action">

                <input
                  type="url"
                  value={
                    repository
                  }
                  onChange={(
                    event,
                  ) => {
                    setRepository(
                      event.target.value,
                    );

                    setGithubEvidence(
                      null,
                    );

                    setRepositoryCommit(
                      "",
                    );

                    setProof(
                      null,
                    );
                  }}
                  placeholder="https://github.com/username/repository"
                />

                <button
                  type="button"
                  onClick={
                    handleVerifyRepository
                  }
                  disabled={
                    githubLoading ||
                    !repository.trim() ||
                    !githubIdentity
                  }
                  className="student-secondary-button"
                >
                  {githubLoading
                    ? "Checking..."
                    : "Verify GitHub"}
                </button>

              </div>

              {!githubIdentity && (
                <p
                  style={{
                    marginTop:
                      "10px",
                  }}
                >
                  Connect your GitHub account before
                  verifying a project repository.
                </p>
              )}

              {githubEvidence && (
                <div
                  className="student-inline-success"
                  style={{
                    marginTop:
                      "12px",
                  }}
                >

                  ✓ Repository verified

                  <div
                    style={{
                      marginTop:
                        "8px",
                    }}
                  >
                    <strong>
                      Repository:
                    </strong>{" "}
                    {
                      githubEvidence.fullName
                    }
                  </div>

                  <div>
                    <strong>
                      Branch:
                    </strong>{" "}
                    {
                      githubEvidence.branch
                    }
                  </div>

                  <div>
                    <strong>
                      Verified commit:
                    </strong>{" "}
                    <code>
                      {
                        githubEvidence.commitSha
                      }
                    </code>
                  </div>

                </div>
              )}

            </div>

            {evidenceType === "PROJECT" && (
              <>
                <div className="student-form-field">
                  <label>PROJECT TECHNOLOGIES</label>
                  <input
                    type="text"
                    value={projectTechnologies}
                    onChange={(event) => setProjectTechnologies(event.target.value)}
                    placeholder="Solidity, React, TypeScript, Ethereum"
                  />
                  <p>Technologies actually used in the project.</p>
                </div>

                <div className="student-form-field">
                  <label>GITHUB REPOSITORY</label>
                  <div className="student-input-action">
                    <input
                      type="url"
                      value={repository}
                      onChange={(event) => {
                        setRepository(event.target.value);
                        setGithubEvidence(null);
                        setRepositoryCommit("");
                        setProof(null);
                      }}
                      placeholder="https://github.com/username/repository"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyRepository}
                      disabled={githubLoading || !repository.trim() || !githubIdentity}
                      className="student-secondary-button"
                    >
                      {githubLoading ? "Checking..." : "Verify GitHub"}
                    </button>
                  </div>
                  {!githubIdentity && (
                    <p style={{ marginTop: "10px" }}>
                      Connect your GitHub account before verifying a project repository.
                    </p>
                  )}
                  {githubEvidence && (
                    <div className="student-inline-success" style={{ marginTop: "12px" }}>
                      ✓ Repository verified
                      <div style={{ marginTop: "8px" }}>
                        <strong>Repository:</strong> {githubEvidence.fullName}
                      </div>
                      <div><strong>Branch:</strong> {githubEvidence.branch}</div>
                      <div><strong>Verified commit:</strong> <code>{githubEvidence.commitSha}</code></div>
                    </div>
                  )}
                </div>
              </>
            )}

            {evidenceType === "COURSE" && (
              <>
                <div className="student-proof-field" style={{ marginTop: "8px" }}>
                  <span>COURSE EVIDENCE</span>
                  <strong>Record the learning outcome, not a generic project.</strong>
                  <p>Provider, exact course, completion date and optional credential reference.</p>
                </div>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label>COURSE PROVIDER / INSTITUTION</label>
                    <input
                      type="text"
                      value={courseProvider}
                      onChange={(event) => setCourseProvider(event.target.value)}
                      placeholder="e.g. Microsoft, Coursera, IIT Delhi"
                    />
                  </div>
                  <div className="student-form-field">
                    <label>COURSE NAME</label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(event) => setCourseName(event.target.value)}
                      placeholder="e.g. Blockchain Fundamentals"
                    />
                  </div>
                </div>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label>COMPLETION DATE</label>
                    <input
                      type="date"
                      value={courseCompletionDate}
                      onChange={(event) => setCourseCompletionDate(event.target.value)}
                    />
                  </div>
                  <div className="student-form-field">
                    <label>CERTIFICATE / CREDENTIAL ID</label>
                    <input
                      type="text"
                      value={courseCredentialId}
                      onChange={(event) => setCourseCredentialId(event.target.value)}
                      placeholder="Optional credential reference"
                    />
                  </div>
                </div>
              </>
            )}

            {evidenceType === "HACKATHON" && (
              <>
                <div className="student-proof-field" style={{ marginTop: "8px" }}>
                  <span>HACKATHON EVIDENCE</span>
                  <strong>Capture the event and result separately from project code.</strong>
                  <p>Participation, event context and outcome are recorded here.</p>
                </div>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label>HACKATHON NAME</label>
                    <input
                      type="text"
                      value={hackathonName}
                      onChange={(event) => setHackathonName(event.target.value)}
                      placeholder="e.g. Microsoft Noida HackBriven"
                    />
                  </div>
                  <div className="student-form-field">
                    <label>ORGANIZER</label>
                    <input
                      type="text"
                      value={hackathonOrganizer}
                      onChange={(event) => setHackathonOrganizer(event.target.value)}
                      placeholder="e.g. Microsoft"
                    />
                  </div>
                </div>

                <div className="student-form-grid">
                  <div className="student-form-field">
                    <label>EVENT DATE</label>
                    <input
                      type="date"
                      value={hackathonDate}
                      onChange={(event) => setHackathonDate(event.target.value)}
                    />
                  </div>
                  <div className="student-form-field">
                    <label>RESULT / PARTICIPATION</label>
                    <select
                      value={hackathonResult}
                      onChange={(event) => setHackathonResult(event.target.value)}
                    >
                      <option value="">Select result</option>
                      <option value="PARTICIPANT">Participant</option>
                      <option value="FINALIST">Finalist</option>
                      <option value="RUNNER_UP">Runner-up</option>
                      <option value="WINNER">Winner</option>
                      <option value="SPECIAL_RECOGNITION">Special Recognition</option>
                    </select>
                  </div>
                </div>

                <div className="student-form-field">
                  <label>TEAM SIZE</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={hackathonTeamSize}
                    onChange={(event) => setHackathonTeamSize(event.target.value)}
                    placeholder="e.g. 4"
                  />
                  <p>Optional. Leave empty if the event was individual.</p>
                </div>
              </>
            )}

            <div className="student-form-grid">

              <div className="student-form-field">

                <label>
                  TIMESTAMP
                </label>

                <input
                  type="datetime-local"
                  value={
                    new Date(
                      timestamp,
                    )
                      .toISOString()
                      .slice(
                        0,
                        16,
                      )
                  }
                  onChange={(
                    event,
                  ) =>
                    setTimestamp(
                      new Date(
                        event.target.value,
                      ).getTime(),
                    )
                  }
                />

              </div>

              <div />

            </div>

            <div className="student-form-actions">

              <button
                type="submit"
                className="student-primary-button"
              >
                Generate Evidence Hash
              </button>

              <button
                type="button"
                onClick={
                  resetEvidence
                }
                className="student-secondary-button"
              >
                Reset
              </button>

            </div>

          </form>

        </section>

        {/* =================================================
            02 CRYPTOGRAPHIC PROOF
            ================================================= */}

        {proof && (

          <section className="student-panel">

            <div className="student-panel-header">

              <div>

                <span>
                  02 / CRYPTOGRAPHIC PROOF
                </span>

                <h2>
                  Evidence commitment generated
                </h2>

                <p>
                  The hash represents the normalized
                  evidence, including the verified GitHub
                  commit when applicable.
                </p>

              </div>

              <div
                className={`student-status-badge ${getStatusClass(
                  proof.status,
                )}`}
              >
                {getStatusLabel(
                  proof.status,
                )}
              </div>

            </div>

            <div className="student-proof-grid">

              <div className="student-proof-field">

                <span>
                  EVIDENCE HASH
                </span>

                <code>
                  {
                    proof.evidenceHash
                  }
                </code>

              </div>

              <div className="student-proof-field">

                <span>
                  OWNER
                </span>

                <code>
                  {
                    proof.evidence.owner
                  }
                </code>

              </div>

              <div className="student-proof-field">

                <span>
                  TYPE
                </span>

                <strong>
                  {
                    proof.evidence.type
                  }
                </strong>

              </div>

              <div className="student-proof-field">

                <span>
                  TITLE
                </span>

                <strong>
                  {
                    proof.evidence.title
                  }
                </strong>

              </div>

              <div className="student-proof-field">

                <span>
                  SKILLS
                </span>

                <strong>
                  {
                    proof.evidence.skills.join(
                      ", ",
                    ) ||
                    "None"
                  }
                </strong>

              </div>

              <div className="student-proof-field">

                <span>
                  CREATED
                </span>

                <strong>
                  {formatDateTime(
                    proof.createdAt,
                  )}
                </strong>

              </div>

            </div>

            {proof.evidence.repositoryCommit && (
              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <span>
                  VERIFIED GITHUB COMMIT
                </span>

                <code>
                  {
                    proof.evidence.repositoryCommit
                  }
                </code>

                {githubEvidence && (
                  <a
                    href={
                      githubEvidence.commitUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    View verified commit →
                  </a>
                )}

              </div>
            )}

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "20px",
              }}
            >

              <span>
                WALLET SIGNATURE
              </span>

              {proof.signature ? (

                <>

                  <strong>
                    ✓ Evidence signed by owner
                  </strong>

                  <code>
                    {
                      proof.signature
                    }
                  </code>

                  {proof.recoveredSigner && (
                    <code>
                      Recovered signer:{" "}
                      {
                        proof.recoveredSigner
                      }
                    </code>
                  )}

                </>

              ) : (

                <button
                  type="button"
                  onClick={
                    handleSignEvidence
                  }
                  className="student-primary-button"
                >
                  Sign Evidence
                </button>

              )}

            </div>

            {githubEvidence && (

              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <span>
                  GITHUB AUTHENTICITY
                </span>

                <strong>
                  ✓ Repository owner and latest commit verified
                </strong>

                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >

                  <div>
                    <strong>
                      GitHub account:
                    </strong>{" "}
                    @{githubIdentity?.login}
                  </div>

                  <div>
                    <strong>
                      Repository:
                    </strong>{" "}
                    {
                      githubEvidence.fullName
                    }
                  </div>

                  <div>
                    <strong>
                      Owner ID:
                    </strong>{" "}
                    {
                      githubEvidence.ownerId
                    }
                  </div>

                  <div>
                    <strong>
                      Branch:
                    </strong>{" "}
                    {
                      githubEvidence.branch
                    }
                  </div>

                  <div>
                    <strong>
                      Commit:
                    </strong>{" "}
                    <code>
                      {
                        githubEvidence.commitSha
                      }
                    </code>
                  </div>

                </div>

              </div>

            )}

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <span>
                PUBLIC VERIFICATION
              </span>

              <strong>
                Scan to verify this evidence
              </strong>

              <p
                style={{
                  margin:
                    "8px 0 16px",
                }}
              >
                The QR code contains only a public
                verification URL.
              </p>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  alignItems:
                    "center",
                  gap:
                    "16px",
                  padding:
                    "24px",
                  marginTop:
                    "10px",
                  borderRadius:
                    "18px",
                  background:
                    "rgba(255, 255, 255, 0.04)",
                  border:
                    "1px solid rgba(255, 255, 255, 0.10)",
                }}
              >

                <div
                  style={{
                    background:
                      "#ffffff",
                    padding:
                      "14px",
                    borderRadius:
                      "16px",
                    lineHeight:
                      0,
                  }}
                >

                  <QRCodeSVG
                    value={
                      publicVerificationUrl
                    }
                    size={
                      220
                    }
                    level="H"
                    includeMargin
                  />

                </div>

                <strong>
                  EduProof Public Verification
                </strong>

                <code
                  style={{
                    width:
                      "100%",
                    maxWidth:
                      "700px",
                    wordBreak:
                      "break-all",
                    textAlign:
                      "center",
                    fontSize:
                      "11px",
                  }}
                >
                  {
                    publicVerificationUrl
                  }
                </code>

                <Link
                  to={`/verify?hash=${encodeURIComponent(
                    proof.evidenceHash,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="student-view-all"
                >
                  Open Verification Page →
                </Link>

              </div>

            </div>

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <span>
                SEPOLIA BLOCKCHAIN INTEGRITY
              </span>

              <strong>
                EvidenceRegistry
              </strong>

              <p
                style={{
                  margin:
                    "8px 0",
                }}
              >
                The evidence itself remains off-chain.
                Its cryptographic commitment is anchored
                publicly on Ethereum Sepolia.
              </p>

              <div className="student-form-actions">

                <button
                  type="button"
                  onClick={
                    handleAnchorEvidence
                  }
                  disabled={
                    anchorLoading ||
                    !proof.signature ||
                    proof.status ===
                      "ANCHORED"
                  }
                  className="student-primary-button"
                >
                  {anchorLoading
                    ? "Anchoring..."
                    : proof.status ===
                        "ANCHORED"
                      ? "Already Anchored"
                      : "Anchor on Sepolia"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void verifyCurrentEvidence()
                  }
                  disabled={
                    verifyingBlockchain
                  }
                  className="student-secondary-button"
                >
                  {verifyingBlockchain
                    ? "Verifying..."
                    : "Verify on Blockchain"}
                </button>

              </div>

            </div>

            {anchorResult && (

              <div
                className="student-inline-success"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                ✓ Evidence anchored successfully

                <div
                  style={{
                    marginTop:
                      "10px",
                  }}
                >

                  <strong>
                    Transaction:
                  </strong>{" "}

                  <a
                    href={`https://sepolia.etherscan.io/tx/${anchorResult.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {
                      shortenValue(
                        anchorResult.transactionHash,
                        18,
                        14,
                      )
                    }
                  </a>

                </div>

                <div>
                  <strong>
                    Block:
                  </strong>{" "}
                  #
                  {
                    anchorResult.blockNumber
                  }
                </div>

              </div>

            )}

            {blockchainVerification && (

              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <span>
                  ON-CHAIN VERIFICATION
                </span>

                <strong>
                  {blockchainVerification.verified
                    ? "✓ Cryptographic proof verified"
                    : "✕ Verification failed"}
                </strong>

                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >

                  <div>
                    <strong>
                      Commitment exists:
                    </strong>{" "}
                    {blockchainVerification.exists
                      ? "YES"
                      : "NO"}
                  </div>

                  <div>
                    <strong>
                      Owner matches:
                    </strong>{" "}
                    {blockchainVerification.ownerMatches
                      ? "YES"
                      : "NO"}
                  </div>

                  <div>
                    <strong>
                      Active:
                    </strong>{" "}
                    {blockchainVerification.active
                      ? "YES"
                      : "NO"}
                  </div>

                  {blockchainVerification.owner && (
                    <div>
                      <strong>
                        On-chain owner:
                      </strong>{" "}
                      <code>
                        {
                          blockchainVerification.owner
                        }
                      </code>
                    </div>
                  )}

                  {blockchainVerification.anchoredAt >
                    0 && (
                    <div>
                      <strong>
                        Anchored:
                      </strong>{" "}
                      {formatDateTime(
                        blockchainVerification.anchoredAt,
                      )}
                    </div>
                  )}

                  <div>
                    <strong>
                      Status:
                    </strong>{" "}
                    {blockchainVerification.status ===
                    1
                      ? "ACTIVE"
                      : blockchainVerification.status ===
                          2
                        ? "REVOKED"
                        : "NOT FOUND"}
                  </div>

                  <div
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >
                    <strong>
                      Verification result:
                    </strong>{" "}
                    {
                      blockchainVerification.reason
                    }
                  </div>

                </div>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            03 YOUR EVIDENCE
            ================================================= */}

        <section className="student-panel">

          <div className="student-panel-header">

            <div>

              <span>
                03 / YOUR EVIDENCE
              </span>

              <h2>
                Select evidence for an achievement
              </h2>

              <p>
                Select multiple evidence records to build
                a single cryptographically aggregated
                achievement.
              </p>

            </div>

            <span>
              {selectedEvidenceIds.length} selected
            </span>

          </div>

          {storedEvidence.length === 0 ? (

            <div className="student-empty-state">

              <div>
                ◇
              </div>

              <h3>
                No evidence yet
              </h3>

              <p>
                Create and sign your first evidence
                record above.
              </p>

            </div>

          ) : (

            <div className="student-credential-grid">

              {storedEvidence.map(
                (
                  item,
                ) => {

                  const selected =
                    selectedEvidenceIds.includes(
                      item.id,
                    );

                  return (
                    <article
                      key={
                        item.id
                      }
                      className="student-credential-card"
                      style={{
                        border:
                          selected
                            ? "2px solid currentColor"
                            : undefined,
                      }}
                    >

                      <div className="student-card-top">

                        <span>
                          {
                            item.evidence.type
                          }
                        </span>

                        <span
                          className={`student-status-badge ${getStatusClass(
                            item.status,
                          )}`}
                        >
                          {
                            item.status
                          }
                        </span>

                      </div>

                      <h3>
                        {
                          item.evidence.title
                        }
                      </h3>

                      <p>
                        {
                          item.evidence.description
                        }
                      </p>

                      <div className="student-card-meta">

                        <span>
                          HASH
                        </span>

                        <code>
                          {shortenValue(
                            item.evidenceHash,
                          )}
                        </code>

                      </div>

                      <div className="student-card-meta">

                        <span>
                          CREATED
                        </span>

                        <strong>
                          {formatDateTime(
                            item.createdAt,
                          )}
                        </strong>

                      </div>

                      <div
                        style={{
                          display:
                            "flex",
                          gap:
                            "10px",
                          marginTop:
                            "16px",
                        }}
                      >

                        <button
                          type="button"
                          className={
                            selected
                              ? "student-primary-button"
                              : "student-secondary-button"
                          }
                          onClick={() =>
                            toggleEvidenceSelection(
                              item.id,
                            )
                          }
                        >
                          {selected
                            ? "✓ Selected"
                            : "Select for Achievement"}
                        </button>

                        <button
                          type="button"
                          className="student-view-all"
                          onClick={() => {

                            setProof(
                              item,
                            );

                            setEvidenceType(
                              item.evidence.type,
                            );

                            setTitle(
                              item.evidence.title,
                            );

                            setDescription(
                              item.evidence.description,
                            );

                            setOwner(
                              item.evidence.owner,
                            );

                            setRepository(
                              item.evidence.repository ||
                                "",
                            );

                            setRepositoryCommit(
                              item.evidence.repositoryCommit ||
                                "",
                            );

                            setSkillsInput(
                              item.evidence.skills.join(
                                ", ",
                              ),
                            );

                            setTimestamp(
                              item.evidence.timestamp,
                            );

                            window.scrollTo({
                              top:
                                0,
                              behavior:
                                "smooth",
                            });
                          }}
                        >
                          View
                        </button>

                      </div>

                    </article>
                  );
                },
              )}

            </div>

          )}

        </section>

        {/* =================================================
            04 PROOF OF ACHIEVEMENT
            ================================================= */}

        <section className="student-panel">

          <div className="student-panel-header">

            <div>

              <span>
                04 / PROOF OF ACHIEVEMENT
              </span>

              <h2>
                Aggregate your evidence
              </h2>

              <p>
                An achievement is created by satisfying
                defined criteria over a selected evidence
                set.
              </p>

            </div>

            <span>
              {selectedEvidence.length} evidence
            </span>

          </div>

          {achievementError && (
            <div className="student-alert error">

              <strong>
                Achievement error
              </strong>

              <span>
                {achievementError}
              </span>

            </div>
          )}

          <div className="student-form">

            <div className="student-form-grid">

              <div className="student-form-field">

                <label>
                  ACHIEVEMENT TITLE
                </label>

                <input
                  type="text"
                  value={
                    achievementTitle
                  }
                  onChange={(
                    event,
                  ) => {
                    setAchievementTitle(
                      event.target.value,
                    );

                    setCurrentAchievement(
                      null,
                    );
                  }}
                  placeholder="e.g. Full-Stack Blockchain Developer"
                />

              </div>

              <div className="student-form-field">

                <label>
                  ACHIEVEMENT SKILLS
                </label>

                <input
                  type="text"
                  value={
                    achievementSkills
                  }
                  onChange={(
                    event,
                  ) =>
                    setAchievementSkills(
                      event.target.value,
                    )
                  }
                  placeholder="Blockchain, Solidity, React"
                />

              </div>

            </div>

            <div className="student-form-field">

              <label>
                ACHIEVEMENT DESCRIPTION
              </label>

              <textarea
                value={
                  achievementDescription
                }
                onChange={(
                  event,
                ) =>
                  setAchievementDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe what this collection of evidence proves..."
                rows={4}
              />

            </div>

            {/* =============================================
                SELECTED EVIDENCE
                ============================================= */}

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "20px",
              }}
            >

              <span>
                SELECTED EVIDENCE
              </span>

              {selectedEvidence.length ===
              0 ? (

                <p>
                  Select evidence from the section above.
                </p>

              ) : (

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "8px",
                    marginTop:
                      "10px",
                  }}
                >

                  {selectedEvidence.map(
                    (
                      item,
                    ) => (
                      <div
                        key={
                          item.id
                        }
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "12px",
                          padding:
                            "12px",
                          border:
                            "1px solid rgba(255,255,255,0.1)",
                          borderRadius:
                            "12px",
                        }}
                      >

                        <div>

                          <strong>
                            {
                              item.evidence.title
                            }
                          </strong>

                          <div>
                            {
                              item.evidence.type
                            }
                          </div>

                        </div>

                        <code>
                          {shortenValue(
                            item.evidenceHash,
                            10,
                            8,
                          )}
                        </code>

                      </div>
                    ),
                  )}

                </div>

              )}

            </div>

            {/* =============================================
                CRITERIA
                ============================================= */}

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <span>
                ACHIEVEMENT CRITERIA
              </span>

              <p>
                Every criterion must pass before the
                achievement can be anchored.
              </p>

              <div
                style={{
                  display:
                    "flex",
                  flexWrap:
                    "wrap",
                  gap:
                    "8px",
                  marginTop:
                    "12px",
                }}
              >

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={() =>
                    addCriterion(
                      "MIN_EVIDENCE_COUNT",
                    )
                  }
                >
                  + Evidence Count
                </button>

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={() =>
                    addCriterion(
                      "REQUIRED_EVIDENCE_TYPE",
                    )
                  }
                >
                  + Evidence Type
                </button>

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={() =>
                    addCriterion(
                      "REQUIRED_SKILL",
                    )
                  }
                >
                  + Required Skill
                </button>

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={() =>
                    addCriterion(
                      "REQUIRED_GITHUB_EVIDENCE",
                    )
                  }
                >
                  + GitHub Evidence
                </button>

                <button
                  type="button"
                  className="student-secondary-button"
                  onClick={() =>
                    addCriterion(
                      "REQUIRED_VERIFIED_EVIDENCE",
                    )
                  }
                >
                  + Verified Evidence
                </button>

              </div>

              <div
                style={{
                  display:
                    "flex",
                  flexDirection:
                    "column",
                  gap:
                    "12px",
                  marginTop:
                    "16px",
                }}
              >

                {achievementCriteria.map(
                  (
                    criterion,
                  ) => (

                    <div
                      key={
                        criterion.id
                      }
                      style={{
                        padding:
                          "16px",
                        border:
                          "1px solid rgba(255,255,255,0.1)",
                        borderRadius:
                          "14px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          gap:
                            "12px",
                        }}
                      >

                        <strong>
                          {
                            criterion.label
                          }
                        </strong>

                        <button
                          type="button"
                          className="student-view-all"
                          onClick={() =>
                            removeCriterion(
                              criterion.id,
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                      {criterion.type ===
                        "MIN_EVIDENCE_COUNT" && (

                        <div
                          className="student-form-field"
                          style={{
                            marginTop:
                              "12px",
                          }}
                        >

                          <label>
                            MINIMUM COUNT
                          </label>

                          <input
                            type="number"
                            min={
                              1
                            }
                            value={
                              criterion.minimumCount ??
                              1
                            }
                            onChange={(
                              event,
                            ) =>
                              updateCriterion(
                                criterion.id,
                                {
                                  minimumCount:
                                    Math.max(
                                      1,
                                      Number(
                                        event.target.value,
                                      ),
                                    ),
                                },
                              )
                            }
                          />

                        </div>

                      )}

                      {criterion.type ===
                        "REQUIRED_EVIDENCE_TYPE" && (

                        <div
                          className="student-form-field"
                          style={{
                            marginTop:
                              "12px",
                          }}
                        >

                          <label>
                            EVIDENCE TYPE
                          </label>

                          <select
                            value={
                              criterion.evidenceType ??
                              "PROJECT"
                            }
                            onChange={(
                              event,
                            ) =>
                              updateCriterion(
                                criterion.id,
                                {
                                  evidenceType:
                                    event.target.value as EvidenceType,
                                },
                              )
                            }
                          >

                            <option value="PROJECT">
                              Project
                            </option>

                            <option value="COURSE">
                              Course
                            </option>

                            <option value="ASSESSMENT">
                              Assessment
                            </option>

                            <option value="HACKATHON">
                              Hackathon
                            </option>

                            <option value="INTERNSHIP">
                              Internship
                            </option>

                            <option value="OPEN_SOURCE">
                              Open Source
                            </option>

                            <option value="RESEARCH">
                              Research
                            </option>

                            <option value="ATTESTATION">
                              Attestation
                            </option>

                          </select>

                        </div>

                      )}

                      {criterion.type ===
                        "REQUIRED_SKILL" && (

                        <div
                          className="student-form-field"
                          style={{
                            marginTop:
                              "12px",
                          }}
                        >

                          <label>
                            REQUIRED SKILL
                          </label>

                          <input
                            type="text"
                            value={
                              criterion.skill ??
                              ""
                            }
                            onChange={(
                              event,
                            ) =>
                              updateCriterion(
                                criterion.id,
                                {
                                  skill:
                                    event.target.value,
                                },
                              )
                            }
                            placeholder="e.g. Solidity"
                          />

                        </div>

                      )}

                    </div>

                  ),
                )}

              </div>

            </div>

            {/* =============================================
                EVALUATION
                ============================================= */}

            {achievementResults.length >
              0 && (

              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "24px",
                }}
              >

                <span>
                  CRITERION RESULTS
                </span>

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    gap:
                      "10px",
                    marginTop:
                      "12px",
                  }}
                >

                  {achievementResults.map(
                    (
                      result,
                    ) => (

                      <div
                        key={
                          result.criterion.id
                        }
                        style={{
                          padding:
                            "14px",
                          borderRadius:
                            "12px",
                          border:
                            result.passed
                              ? "1px solid rgba(52,211,153,0.35)"
                              : "1px solid rgba(248,113,113,0.35)",
                        }}
                      >

                        <strong>
                          {result.passed
                            ? "✓ "
                            : "✕ "}

                          {
                            result.criterion.label
                          }
                        </strong>

                        <p>
                          {
                            result.explanation
                          }
                        </p>

                      </div>

                    ),
                  )}

                </div>

              </div>

            )}

            {/* =============================================
                MERKLE PREVIEW
                ============================================= */}

            {achievementMerklePreview && (

              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "24px",
                }}
              >

                <span>
                  CRYPTOGRAPHIC AGGREGATION
                </span>

                <strong>
                  Evidence → Merkle Tree → Root
                </strong>

                <div
                  style={{
                    marginTop:
                      "14px",
                    display:
                      "flex",
                      flexDirection:
                        "column",
                    gap:
                      "10px",
                  }}
                >

                  <div>

                    <strong>
                      Leaves:
                    </strong>{" "}
                    {
                      achievementMerklePreview.leaves.length
                    }

                  </div>

                  <div>

                    <strong>
                      Merkle Root:
                    </strong>

                    <code
                      style={{
                        display:
                          "block",
                        marginTop:
                          "6px",
                        wordBreak:
                          "break-all",
                      }}
                    >
                      {
                        achievementMerklePreview.root
                      }
                    </code>

                  </div>

                  {achievementIdPreview && (
                    <div>

                      <strong>
                        Achievement ID:
                      </strong>

                      <code
                        style={{
                          display:
                            "block",
                          marginTop:
                            "6px",
                          wordBreak:
                            "break-all",
                        }}
                      >
                        {
                          achievementIdPreview
                        }
                      </code>

                    </div>
                  )}

                </div>

              </div>

            )}

            <div
              className="student-form-actions"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <button
                type="button"
                className="student-secondary-button"
                onClick={
                  handleEvaluateAchievement
                }
                disabled={
                  selectedEvidence.length ===
                    0 ||
                  achievementCriteria.length ===
                    0
                }
              >
                Evaluate Criteria
              </button>

              <button
                type="button"
                className="student-primary-button"
                onClick={
                  handleCreateAchievement
                }
                disabled={
                  achievementLoading ||
                  achievementResults.length ===
                    0 ||
                  !achievementResults.every(
                    (
                      result,
                    ) =>
                      result.passed,
                  )
                }
              >
                {achievementLoading
                  ? "Generating..."
                  : "Generate Proof of Achievement"}
              </button>

              <button
                type="button"
                className="student-secondary-button"
                onClick={
                  resetAchievement
                }
              >
                Reset Achievement
              </button>

            </div>

          </div>

        </section>

        {/* =================================================
            05 ACHIEVEMENT PROOF
            ================================================= */}

        {currentAchievement && (

          <section className="student-panel">

            <div className="student-panel-header">

              <div>

                <span>
                  05 / ACHIEVEMENT PROOF
                </span>

                <h2>
                  {
                    currentAchievement.achievement.title
                  }
                </h2>

                <p>
                  {
                    currentAchievement.achievement.description
                  }
                </p>

              </div>

              <div
                className={`student-status-badge ${getStatusClass(
                  currentAchievement.status,
                )}`}
              >
                {
                  currentAchievement.status
                }
              </div>

            </div>

            <div className="student-proof-grid">

              <div className="student-proof-field">

                <span>
                  QUALIFIED
                </span>

                <strong>
                  {
                    currentAchievement.qualified
                      ? "✓ ALL CRITERIA PASSED"
                      : "✕ CRITERIA NOT SATISFIED"
                  }
                </strong>

              </div>

              <div className="student-proof-field">

                <span>
                  EVIDENCE COUNT
                </span>

                <strong>
                  {
                    currentAchievement.evidenceHashes.length
                  }
                </strong>

              </div>

              <div className="student-proof-field">

                <span>
                  MERKLE ROOT
                </span>

                <code>
                  {
                    currentAchievement.merkleRoot ||
                    "Not generated"
                  }
                </code>

              </div>

              <div className="student-proof-field">

                <span>
                  ACHIEVEMENT ID
                </span>

                <code>
                  {
                    achievementIdPreview
                  }
                </code>

              </div>

            </div>

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <span>
                EVIDENCE GRAPH
              </span>

              <strong>
                {
                  currentAchievement.evidenceIds.length
                } evidence node
                {
                  currentAchievement.evidenceIds.length ===
                  1
                    ? ""
                    : "s"
                }{" "}
                aggregated into one proof
              </strong>

              <div
                style={{
                  marginTop:
                    "12px",
                }}
              >

                {currentAchievement.evidenceHashes.map(
                  (
                    hash,
                    index,
                  ) => (

                    <div
                      key={
                        hash
                      }
                      style={{
                        padding:
                          "10px 0",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.08)",
                      }}
                    >

                      <strong>
                        Evidence {index + 1}
                      </strong>

                      <code
                        style={{
                          display:
                            "block",
                          marginTop:
                            "4px",
                          wordBreak:
                            "break-all",
                        }}
                      >
                        {
                          hash
                        }
                      </code>

                    </div>

                  ),
                )}

              </div>

            </div>

            {/* =============================================
                ACHIEVEMENT ANCHOR
                ============================================= */}

            <div
              className="student-proof-field"
              style={{
                marginTop:
                  "24px",
              }}
            >

              <span>
                BLOCKCHAIN ANCHOR
              </span>

              <p>
                Only the Achievement ID and Merkle root
                are anchored on Ethereum Sepolia. The
                underlying evidence remains off-chain.
              </p>

              <div className="student-form-actions">

                <button
                  type="button"
                  className="student-primary-button"
                  onClick={() =>
                    void handleAnchorAchievement()
                  }
                  disabled={
                    achievementAnchorLoading ||
                    !currentAchievement.qualified ||
                    Boolean(
                      currentAchievement.anchorTransactionHash,
                    )
                  }
                >
                  {achievementAnchorLoading
                    ? "Anchoring Achievement..."
                    : currentAchievement.anchorTransactionHash
                      ? "Achievement Anchored"
                      : "Anchor Achievement on Sepolia"}
                </button>

              </div>

              {currentAchievement.anchorTransactionHash && (

                <div
                  className="student-inline-success"
                  style={{
                    marginTop:
                      "16px",
                  }}
                >

                  ✓ Achievement anchored successfully

                  <div
                    style={{
                      marginTop:
                        "10px",
                    }}
                  >

                    <strong>
                      Transaction:
                    </strong>{" "}

                    <a
                      href={`https://sepolia.etherscan.io/tx/${currentAchievement.anchorTransactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {
                        shortenValue(
                          currentAchievement.anchorTransactionHash,
                          18,
                          14,
                        )
                      }
                    </a>

                  </div>

                  <div>

                    <strong>
                      Block:
                    </strong>{" "}
                    #
                    {
                      currentAchievement.anchorBlockNumber
                    }

                  </div>

                </div>

              )}

            </div>

            {/* =============================================
                ACHIEVEMENT QR
                ============================================= */}

            {achievementIdPreview && (

              <div
                className="student-proof-field"
                style={{
                  marginTop:
                    "24px",
                }}
              >

                <span>
                  ACHIEVEMENT VERIFICATION
                </span>

                <strong>
                  Scan to verify the complete Proof of
                  Achievement
                </strong>

                <p
                  style={{
                    margin:
                      "8px 0 16px",
                  }}
                >
                  The QR contains the public achievement
                  verification URL, not the underlying
                  evidence.
                </p>

                <div
                  style={{
                    display:
                      "flex",
                    flexDirection:
                      "column",
                    alignItems:
                      "center",
                    gap:
                      "16px",
                    padding:
                      "24px",
                    borderRadius:
                      "18px",
                    background:
                      "rgba(255,255,255,0.04)",
                    border:
                      "1px solid rgba(255,255,255,0.10)",
                  }}
                >

                  <div
                    style={{
                      background:
                        "#ffffff",
                      padding:
                        "14px",
                      borderRadius:
                        "16px",
                      lineHeight:
                        0,
                    }}
                  >

                    <QRCodeSVG
                      value={
                        achievementVerificationUrl
                      }
                      size={
                        240
                      }
                      level="H"
                      includeMargin
                    />

                  </div>

                  <strong>
                    EduProof Proof of Achievement
                  </strong>

                  <code
                    style={{
                      width:
                        "100%",
                      maxWidth:
                        "700px",
                      wordBreak:
                        "break-all",
                      textAlign:
                        "center",
                      fontSize:
                        "11px",
                    }}
                  >
                    {
                      achievementVerificationUrl
                    }
                  </code>

                  <Link
                    to={`/verify-achievement?id=${encodeURIComponent(
                      achievementIdPreview,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="student-view-all"
                  >
                    Open Achievement Verification →
                  </Link>

                </div>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            06 EXISTING ACHIEVEMENTS
            ================================================= */}

        {achievements.length > 0 && (

          <section className="student-panel">

            <div className="student-panel-header">

              <div>

                <span>
                  06 / MY ACHIEVEMENTS
                </span>

                <h2>
                  Proofs you have created
                </h2>

                <p>
                  Previously generated achievement proofs
                  remain locally available in this prototype.
                </p>

              </div>

              <span>
                {achievements.length}
              </span>

            </div>

            <div className="student-credential-grid">

              {achievements.map(
                (
                  achievement,
                ) => (

                  <article
                    key={
                      achievement.id
                    }
                    className="student-credential-card"
                  >

                    <div className="student-card-top">

                      <span>
                        ACHIEVEMENT
                      </span>

                      <span
                        className={`student-status-badge ${getStatusClass(
                          achievement.status,
                        )}`}
                      >
                        {
                          achievement.status
                        }
                      </span>

                    </div>

                    <h3>
                      {
                        achievement.achievement.title
                      }
                    </h3>

                    <p>
                      {
                        achievement.achievement.description
                      }
                    </p>

                    <div className="student-card-meta">

                      <span>
                        EVIDENCE
                      </span>

                      <strong>
                        {
                          achievement.evidenceIds.length
                        }
                      </strong>

                    </div>

                    <div className="student-card-meta">

                      <span>
                        MERKLE ROOT
                      </span>

                      <code>
                        {shortenValue(
                          achievement.merkleRoot ||
                            "",
                        )}
                      </code>

                    </div>

                    <div className="student-card-meta">

                      <span>
                        CREATED
                      </span>

                      <strong>
                        {formatDateTime(
                          achievement.createdAt,
                        )}
                      </strong>

                    </div>

                    <button
                      type="button"
                      className="student-view-all"
                      onClick={() =>
                        setCurrentAchievement(
                          achievement,
                        )
                      }
                    >
                      View Achievement →
                    </button>

                  </article>

                ),
              )}

            </div>

          </section>

        )}

        {/* =================================================
            HOW IT WORKS
            ================================================= */}

        <section className="student-panel">

          <div className="student-panel-header">

            <div>

              <span>
                HOW EDUPROOF PROVES IT
              </span>

              <h2>
                From evidence to achievement
              </h2>

              <p>
                EduProof combines independently verifiable
                evidence into a cryptographic proof.
              </p>

            </div>

          </div>

          <div className="student-credential-grid">

            <div className="student-credential-card">

              <h3>
                01. Evidence
              </h3>

              <p>
                Student creates evidence describing a
                project, course, assessment, hackathon,
                internship, research result, or other
                achievement.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                02. Canonicalize
              </h3>

              <p>
                Evidence is converted into a deterministic
                representation before hashing.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                03. Sign
              </h3>

              <p>
                The evidence owner signs the cryptographic
                commitment with their Ethereum wallet.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                04. Evidence Graph
              </h3>

              <p>
                Multiple evidence records become nodes
                contributing to one achievement.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                05. Merkle Root
              </h3>

              <p>
                Evidence hashes are deterministically
                aggregated into a Merkle root.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                06. Blockchain
              </h3>

              <p>
                The achievement ID and Merkle root are
                anchored on Ethereum Sepolia.
              </p>

            </div>

          </div>

        </section>

        <div
          style={{
            textAlign:
              "center",
            marginTop:
              "28px",
          }}
        >

          <Link
            to="/"
            className="student-back-link"
          >
            ← Return to EduProof
          </Link>

        </div>

      </main>

    </StudentLayout>
  );
}