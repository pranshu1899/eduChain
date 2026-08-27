import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import type {
  AchievementCriterion,
  AchievementCriterionType,
  StoredAchievement,
} from "../../types/achievement";

import type {
  EvidenceType,
  StoredEvidence,
} from "../../types/evidence";

import {
  getStoredEvidence,
} from "../../services/evidenceService";

import {
  createAchievementProof,
  saveAchievement,
  getAchievementsByOwner,
} from "../../services/achievementService";

import {
  getConnectedWallet,
} from "../../services/evidenceService";

const EVIDENCE_TYPES:
  EvidenceType[] = [
  "PROJECT",
  "COURSE",
  "ASSESSMENT",
  "HACKATHON",
  "INTERNSHIP",
  "OPEN_SOURCE",
  "RESEARCH",
  "ATTESTATION",
];

function createCriterion(
  type: AchievementCriterionType,
  index: number,
): AchievementCriterion {
  return {
    id:
      `criterion-${Date.now()}-${index}`,

    type,

    label:
      type === "MIN_EVIDENCE_COUNT"
        ? "Minimum evidence"
        : type ===
            "REQUIRED_EVIDENCE_TYPE"
          ? "Required evidence type"
          : type ===
              "REQUIRED_SKILL"
            ? "Required skill"
            : type ===
                "REQUIRED_GITHUB_EVIDENCE"
              ? "GitHub evidence"
              : "Verified evidence",

    minimumCount:
      type ===
      "MIN_EVIDENCE_COUNT"
        ? 1
        : undefined,

    evidenceType:
      type ===
      "REQUIRED_EVIDENCE_TYPE"
        ? "PROJECT"
        : undefined,

    skill:
      type ===
      "REQUIRED_SKILL"
        ? ""
        : undefined,
  };
}

export default function StudentAchievements() {
  const navigate =
    useNavigate();

  const [
    wallet,
    setWallet,
  ] =
    useState("");

  const [
    evidence,
    setEvidence,
  ] =
    useState<StoredEvidence[]>(
      [],
    );

  const [
    achievements,
    setAchievements,
  ] =
    useState<StoredAchievement[]>(
      [],
    );

  const [
    selectedEvidence,
    setSelectedEvidence,
  ] =
    useState<string[]>(
      [],
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    skills,
    setSkills,
  ] =
    useState("");

  const [
    criteria,
    setCriteria,
  ] =
    useState<
      AchievementCriterion[]
    >([
      createCriterion(
        "MIN_EVIDENCE_COUNT",
        0,
      ),
    ]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    creating,
    setCreating,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");

      const {
        address,
      } =
        await getConnectedWallet();

      setWallet(address);

      const studentEvidence =
        getStoredEvidence();

      setEvidence(
        studentEvidence.filter(
          (item) =>
            item.evidence.owner
              .toLowerCase() ===
            address.toLowerCase(),
        ),
      );

      setAchievements(
        getAchievementsByOwner(
          address,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load achievements.",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleEvidence(
    id: string,
  ) {
    setSelectedEvidence(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id,
            )
          : [
              ...current,
              id,
            ],
    );
  }

  function addCriterion() {
    setCriteria(
      (current) => [
        ...current,
        createCriterion(
          "REQUIRED_SKILL",
          current.length,
        ),
      ],
    );
  }

  function updateCriterion(
    index: number,
    updates: Partial<AchievementCriterion>,
  ) {
    setCriteria(
      (current) =>
        current.map(
          (criterion, i) =>
            i === index
              ? {
                  ...criterion,
                  ...updates,
                }
              : criterion,
        ),
    );
  }

  function removeCriterion(
    index: number,
  ) {
    setCriteria(
      (current) =>
        current.filter(
          (_, i) =>
            i !== index,
        ),
    );
  }

  async function handleCreate() {
    try {
      setCreating(true);
      setError("");

      if (!wallet) {
        throw new Error(
          "Connect the student wallet first.",
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

      const input = {
        owner: wallet,

        title,

        description,

        skills:
          skills
            .split(",")
            .map(
              (skill) =>
                skill.trim(),
            )
            .filter(Boolean),

        criteria,
      };

      const proof =
        createAchievementProof(
          input,
          selectedEvidence,
        );

      const stored =
        saveAchievement(
          proof,
        );

      setAchievements(
        getAchievementsByOwner(
          wallet,
        ),
      );

      navigate(
        `/student/achievements/${encodeURIComponent(stored.id)}`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create achievement.",
      );
    } finally {
      setCreating(false);
    }
  }

  const selectedCount =
    selectedEvidence.length;

  const activeEvidence =
    useMemo(
      () =>
        evidence.filter(
          (item) =>
            item.status !==
            "REVOKED",
        ),
      [evidence],
    );

  if (loading) {
    return (
      <main>
        <p>
          Loading achievements...
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <p>
            STUDENT
          </p>

          <h1>
            My Achievements
          </h1>

          <p>
            Build verifiable achievements from your
            cryptographically committed evidence.
          </p>
        </div>

        <Link to="/student">
          Back to Student
        </Link>
      </header>

      {error && (
        <div
          style={{
            padding: 16,
            marginBottom: 20,
            border: "1px solid #c00",
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          marginBottom: 40,
        }}
      >
        <h2>
          Create Achievement
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          <label>
            Title

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Full Stack Developer"
            />
          </label>

          <label>
            Description

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe what this achievement represents."
            />
          </label>

          <label>
            Skills

            <input
              value={skills}
              onChange={(event) =>
                setSkills(
                  event.target.value,
                )
              }
              placeholder="Solidity, React, Blockchain"
            />
          </label>
        </div>
      </section>

      <section
        style={{
          marginBottom: 40,
        }}
      >
        <h2>
          Select Evidence
        </h2>

        <p>
          Selected: {selectedCount}
        </p>

        {activeEvidence.length ===
        0 ? (
          <p>
            No usable evidence found.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {activeEvidence.map(
              (item) => {
                const selected =
                  selectedEvidence.includes(
                    item.id,
                  );

                return (
                  <label
                    key={item.id}
                    style={{
                      display:
                        "flex",
                      gap: 12,
                      padding: 16,
                      border:
                        "1px solid #ccc",
                      borderRadius: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={() =>
                        toggleEvidence(
                          item.id,
                        )
                      }
                    />

                    <span>
                      <strong>
                        {
                          item.evidence
                            .title
                        }
                      </strong>

                      <br />

                      {
                        item.evidence
                          .type
                      }

                      <br />

                      {item.status}
                    </span>
                  </label>
                );
              },
            )}
          </div>
        )}
      </section>

      <section
        style={{
          marginBottom: 40,
        }}
      >
        <h2>
          Achievement Criteria
        </h2>

        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {criteria.map(
            (
              criterion,
              index,
            ) => (
              <div
                key={
                  criterion.id
                }
                style={{
                  padding: 16,
                  border:
                    "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                <select
                  value={
                    criterion.type
                  }
                  onChange={(
                    event,
                  ) => {
                    const type =
                      event
                        .target
                        .value as AchievementCriterionType;

                    updateCriterion(
                      index,
                      {
                        type,

                        minimumCount:
                          type ===
                          "MIN_EVIDENCE_COUNT"
                            ? 1
                            : undefined,

                        evidenceType:
                          type ===
                          "REQUIRED_EVIDENCE_TYPE"
                            ? "PROJECT"
                            : undefined,

                        skill:
                          type ===
                          "REQUIRED_SKILL"
                            ? ""
                            : undefined,
                      },
                    );
                  }}
                >
                  <option value="MIN_EVIDENCE_COUNT">
                    Minimum Evidence Count
                  </option>

                  <option value="REQUIRED_EVIDENCE_TYPE">
                    Required Evidence Type
                  </option>

                  <option value="REQUIRED_SKILL">
                    Required Skill
                  </option>

                  <option value="REQUIRED_GITHUB_EVIDENCE">
                    Required GitHub Evidence
                  </option>

                  <option value="REQUIRED_VERIFIED_EVIDENCE">
                    Required Verified Evidence
                  </option>
                </select>

                {criterion.type ===
                  "MIN_EVIDENCE_COUNT" && (
                  <input
                    type="number"
                    min={1}
                    value={
                      criterion.minimumCount ??
                      1
                    }
                    onChange={(
                      event,
                    ) =>
                      updateCriterion(
                        index,
                        {
                          minimumCount:
                            Number(
                              event
                                .target
                                .value,
                            ),
                        },
                      )
                    }
                  />
                )}

                {criterion.type ===
                  "REQUIRED_EVIDENCE_TYPE" && (
                  <select
                    value={
                      criterion.evidenceType ??
                      "PROJECT"
                    }
                    onChange={(
                      event,
                    ) =>
                      updateCriterion(
                        index,
                        {
                          evidenceType:
                            event
                              .target
                              .value as EvidenceType,
                        },
                      )
                    }
                  >
                    {EVIDENCE_TYPES.map(
                      (
                        type,
                      ) => (
                        <option
                          key={
                            type
                          }
                          value={
                            type
                          }
                        >
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                )}

                {criterion.type ===
                  "REQUIRED_SKILL" && (
                  <input
                    value={
                      criterion.skill ??
                      ""
                    }
                    onChange={(
                      event,
                    ) =>
                      updateCriterion(
                        index,
                        {
                          skill:
                            event
                              .target
                              .value,
                        },
                      )
                    }
                    placeholder="Required skill"
                  />
                )}

                <button
                  type="button"
                  onClick={() =>
                    removeCriterion(
                      index,
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ),
          )}
        </div>

        <button
          type="button"
          onClick={
            addCriterion
          }
          style={{
            marginTop: 16,
          }}
        >
          Add Criterion
        </button>
      </section>

      <button
        type="button"
        disabled={creating}
        onClick={
          handleCreate
        }
      >
        {creating
          ? "Creating..."
          : "Create Achievement"}
      </button>

      <section
        style={{
          marginTop: 50,
        }}
      >
        <h2>
          Existing Achievements
        </h2>

        {achievements.length ===
        0 ? (
          <p>
            No achievements created yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {achievements.map(
              (
                achievement,
              ) => (
                <Link
                  key={
                    achievement.id
                  }
                  to={`/student/achievements/${encodeURIComponent(achievement.id)}`}
                >
                  <strong>
                    {
                      achievement
                        .achievement
                        .title
                    }
                  </strong>

                  {" · "}

                  {
                    achievement.status
                  }

                  {" · "}

                  {
                    achievement
                      .evidenceHashes
                      .length
                  }{" "}
                  evidence
                </Link>
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}