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
} from "../../services/achievementService";

import {
  getConnectedWallet,
} from "../../services/evidenceService";

const EVIDENCE_TYPES: EvidenceType[] = [
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
    id: `criterion-${Date.now()}-${index}`,

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

export default function StudentAchievementCreate() {
  const navigate =
    useNavigate();

  const [
    wallet,
    setWallet,
  ] = useState("");

  const [
    evidence,
    setEvidence,
  ] =
    useState<StoredEvidence[]>(
      [],
    );

  const [
    selectedEvidence,
    setSelectedEvidence,
  ] = useState<string[]>(
    [],
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
    skills,
    setSkills,
  ] = useState("");

  const [
    criteria,
    setCriteria,
  ] =
    useState<AchievementCriterion[]>([
      createCriterion(
        "MIN_EVIDENCE_COUNT",
        0,
      ),
    ]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const {
          address,
        } =
          await getConnectedWallet();

        setWallet(address);

        const records =
          getStoredEvidence();

        setEvidence(
          records.filter(
            (item) =>
              item.evidence.owner.toLowerCase() ===
              address.toLowerCase(),
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load achievement data.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

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
          (
            criterion,
            criterionIndex,
          ) =>
            criterionIndex === index
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
          (
            _,
            criterionIndex,
          ) =>
            criterionIndex !==
            index,
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

      if (!title.trim()) {
        throw new Error(
          "Achievement title is required.",
        );
      }

      if (!description.trim()) {
        throw new Error(
          "Achievement description is required.",
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
        criteria.length ===
        0
      ) {
        throw new Error(
          "Add at least one achievement criterion.",
        );
      }

      const input = {
        owner: wallet,

        title:
          title.trim(),

        description:
          description.trim(),

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

      navigate(
        `/student/achievements/${encodeURIComponent(
          stored.id,
        )}`,
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
      <main
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: 32,
        }}
      >
        <p>
          Loading achievement builder...
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
          justifyContent: "space-between",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div>
          <span
            className="student-page-eyebrow"
          >
            ACHIEVEMENT BUILDER
          </span>

          <h1>
            Create Achievement
          </h1>

          <p>
            Combine existing evidence into one
            verifiable achievement.
          </p>
        </div>

        <Link
          to="/student/achievements"
          className="student-view-all"
        >
          ← Back to Achievements
        </Link>
      </header>

      {error && (
        <section className="student-error">
          <div className="student-error-icon">
            !
          </div>

          <div>
            <strong>
              Achievement Error
            </strong>

            <p>
              {error}
            </p>
          </div>
        </section>
      )}

      <section className="student-panel">
        <div className="student-panel-header">
          <div>
            <span>
              STEP 1
            </span>

            <h2>
              Achievement Information
            </h2>

            <p>
              Define what this achievement represents.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          <label>
            <strong>
              Title
            </strong>

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
            <strong>
              Description
            </strong>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Describe what this achievement represents."
              rows={5}
            />
          </label>

          <label>
            <strong>
              Skills
            </strong>

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
        className="student-panel"
        style={{
          marginTop: 24,
        }}
      >
        <div className="student-panel-header">
          <div>
            <span>
              STEP 2
            </span>

            <h2>
              Select Evidence
            </h2>

            <p>
              Choose the evidence records that
              contribute to this achievement.
            </p>
          </div>

          <strong>
            Selected:{" "}
            {selectedEvidence.length}
          </strong>
        </div>

        {activeEvidence.length ===
        0 ? (
          <div className="student-empty">
            <div className="student-empty-icon">
              ◇
            </div>

            <h3>
              No usable evidence
            </h3>

            <p>
              Create and sign evidence before
              building an achievement.
            </p>

            <Link
              to="/student/evidence-test"
              className="student-connect-large"
            >
              Create Evidence
            </Link>
          </div>
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
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: 18,
                      border: selected
                        ? "2px solid #7c3aed"
                        : "1px solid #ccc",
                      borderRadius: 10,
                      cursor: "pointer",
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

                    <div>
                      <strong>
                        {
                          item
                            .evidence
                            .title
                        }
                      </strong>

                      <p>
                        {
                          item
                            .evidence
                            .type
                        }{" "}
                        ·{" "}
                        {
                          item.status
                        }
                      </p>

                      <small>
                        {
                          item
                            .evidence
                            .description
                        }
                      </small>
                    </div>
                  </label>
                );
              },
            )}
          </div>
        )}
      </section>

      <section
        className="student-panel"
        style={{
          marginTop: 24,
        }}
      >
        <div className="student-panel-header">
          <div>
            <span>
              STEP 3
            </span>

            <h2>
              Achievement Criteria
            </h2>

            <p>
              Define the conditions that determine
              whether the achievement qualifies.
            </p>
          </div>
        </div>

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
                  padding: 18,
                  border:
                    "1px solid #ccc",
                  borderRadius: 10,
                  display: "grid",
                  gap: 12,
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
                      event.target
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
                            Math.max(
                              1,
                              Number(
                                event.target
                                  .value,
                              ),
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
                            event.target
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
                            event.target
                              .value,
                        },
                      )
                    }
                    placeholder="Required skill"
                  />
                )}

                {criterion.type ===
                  "REQUIRED_GITHUB_EVIDENCE" && (
                  <p>
                    Requires GitHub-related evidence
                    among the selected evidence.
                  </p>
                )}

                {criterion.type ===
                  "REQUIRED_VERIFIED_EVIDENCE" && (
                  <p>
                    Requires verified evidence among
                    the selected evidence.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() =>
                    removeCriterion(
                      index,
                    )
                  }
                  disabled={
                    criteria.length <=
                    1
                  }
                >
                  Remove Criterion
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
          + Add Criterion
        </button>
      </section>

      <section
        style={{
          marginTop: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="student-connect-large"
          disabled={
            creating ||
            selectedEvidence.length ===
              0
          }
          onClick={() =>
            void handleCreate()
          }
        >
          {creating
            ? "Creating Achievement..."
            : "Create Verifiable Achievement"}
        </button>

        <Link
          to="/student/achievements"
          className="student-view-all"
        >
          Cancel
        </Link>
      </section>
    </main>
  );
}