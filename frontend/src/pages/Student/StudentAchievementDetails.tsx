import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import type {
  StoredAchievement,
} from "../../types/achievement";

import {
  getStoredAchievementById,
  verifyStoredAchievement,
  anchorStoredAchievement,
  getAchievementEvidence,
  verifyAchievementMerkleTree,
} from "../../services/achievementService";

import {
  getAchievementEvidenceProof,
} from "../../services/achievementService";

export default function StudentAchievementDetails() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const [
    achievement,
    setAchievement,
  ] =
    useState<StoredAchievement | null>(
      null,
    );

  const [
    verifying,
    setVerifying,
  ] =
    useState(false);

  const [
    anchoring,
    setAnchoring,
  ] =
    useState(false);

  const [
    verification,
    setVerification,
  ] =
    useState<Awaited<
      ReturnType<
        typeof verifyStoredAchievement
      >
    > | null>(null);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const decodedId =
      decodeURIComponent(id);

    setAchievement(
      getStoredAchievementById(
        decodedId,
      ),
    );
  }, [id]);

  if (!achievement) {
    return (
      <main
        style={{
          padding: 32,
        }}
      >
        <h1>
          Achievement not found
        </h1>

        <Link to="/student/achievements">
          Back to Achievements
        </Link>
      </main>
    );
  }

  const evidence =
    getAchievementEvidence(
      achievement.evidenceIds,
    );

  const localMerkleValid =
    verifyAchievementMerkleTree(
      achievement,
    );

  async function handleVerify() {
    try {
      setVerifying(true);
      setError("");

      const result =
        await verifyStoredAchievement(
          achievement!,
        );

      setVerification(
        result,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Verification failed.",
      );
    } finally {
      setVerifying(false);
    }
  }

  async function handleAnchor() {
    try {
      setAnchoring(true);
      setError("");

      const updated =
        await anchorStoredAchievement(
          achievement!,
        );

      setAchievement(
        updated,
      );

      await handleVerify();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to anchor achievement.",
      );
    } finally {
      setAnchoring(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 32,
      }}
    >
      <Link to="/student/achievements">
        ← Back to Achievements
      </Link>

      <header
        style={{
          marginTop: 30,
          marginBottom: 30,
        }}
      >
        <p>
          ACHIEVEMENT
        </p>

        <h1>
          {
            achievement
              .achievement
              .title
          }
        </h1>

        <p>
          {
            achievement
              .achievement
              .description
          }
        </p>
      </header>

      {error && (
        <div
          style={{
            padding: 16,
            border:
              "1px solid #c00",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      <section
        style={{
          display: "grid",
          gap: 20,
        }}
      >
        <div>
          <strong>
            Owner
          </strong>

          <p>
            {
              achievement
                .achievement
                .owner
            }
          </p>
        </div>

        <div>
          <strong>
            Status
          </strong>

          <p>
            {
              achievement.status
            }
          </p>
        </div>

        <div>
          <strong>
            Achievement ID
          </strong>

          <p
            style={{
              wordBreak:
                "break-all",
            }}
          >
            {achievement.id}
          </p>
        </div>

        <div>
          <strong>
            Merkle Root
          </strong>

          <p
            style={{
              wordBreak:
                "break-all",
            }}
          >
            {achievement.merkleRoot}
          </p>

          <p>
            Local Merkle tree:{" "}
            {localMerkleValid
              ? "VALID"
              : "INVALID"}
          </p>
        </div>

        <div>
          <strong>
            Evidence
          </strong>

          {evidence.map(
            (item) => (
              <div
                key={item.id}
                style={{
                  padding: 14,
                  marginTop: 10,
                  border:
                    "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                <strong>
                  {
                    item.evidence
                      .title
                  }
                </strong>

                <p>
                  Type:{" "}
                  {
                    item.evidence
                      .type
                  }
                </p>

                <p>
                  Status:{" "}
                  {
                    item.status
                  }
                </p>

                <p
                  style={{
                    wordBreak:
                      "break-all",
                  }}
                >
                  Hash:{" "}
                  {
                    item.evidenceHash
                  }
                </p>

                <details>
                  <summary>
                    Merkle Proof
                  </summary>

                  <pre
                    style={{
                      whiteSpace:
                        "pre-wrap",
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {JSON.stringify(
                      getAchievementEvidenceProof(
                        achievement,
                        item.evidenceHash,
                      ),
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </div>
            ),
          )}
        </div>

        <div>
          <strong>
            Criteria
          </strong>

          {achievement.criterionResults.map(
            (result) => (
              <div
                key={
                  result
                    .criterion
                    .id
                }
                style={{
                  padding: 12,
                  marginTop: 8,
                  border:
                    "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                <strong>
                  {result.passed
                    ? "✓"
                    : "✗"}{" "}
                  {
                    result
                      .criterion
                      .label
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
      </section>

      <section
        style={{
          marginTop: 40,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          disabled={verifying}
          onClick={
            handleVerify
          }
        >
          {verifying
            ? "Verifying..."
            : "Verify Achievement"}
        </button>

        {achievement.qualified &&
          !achievement.anchorTransactionHash && (
            <button
              type="button"
              disabled={anchoring}
              onClick={
                handleAnchor
              }
            >
              {anchoring
                ? "Anchoring..."
                : "Anchor on Ethereum"}
            </button>
          )}
      </section>

      {achievement.anchorTransactionHash && (
        <section
          style={{
            marginTop: 30,
            padding: 20,
            border:
              "1px solid #ccc",
            borderRadius: 8,
          }}
        >
          <h2>
            Blockchain Anchor
          </h2>

          <p>
            Transaction
          </p>

          <p
            style={{
              wordBreak:
                "break-all",
            }}
          >
            {
              achievement
                .anchorTransactionHash
            }
          </p>

          <p>
            Block:{" "}
            {
              achievement
                .anchorBlockNumber
            }
          </p>
        </section>
      )}

      {verification && (
        <section
          style={{
            marginTop: 30,
            padding: 20,
            border:
              verification.verified
                ? "2px solid green"
                : "2px solid #c00",
            borderRadius: 8,
          }}
        >
          <h2>
            {verification.verified
              ? "✓ VERIFIED"
              : "✗ VERIFICATION FAILED"}
          </h2>

          <p>
            {
              verification.reason
            }
          </p>

          <ul>
            <li>
              Local Merkle tree:{" "}
              {verification
                .localMerkleValid
                ? "PASS"
                : "FAIL"}
            </li>

            <li>
              Blockchain exists:{" "}
              {verification
                .blockchainExists
                ? "PASS"
                : "FAIL"}
            </li>

            <li>
              Blockchain active:{" "}
              {verification
                .blockchainActive
                ? "PASS"
                : "FAIL"}
            </li>

            <li>
              Merkle root matches:{" "}
              {verification
                .merkleRootMatches
                ? "PASS"
                : "FAIL"}
            </li>

            <li>
              Owner matches:{" "}
              {verification
                .ownerMatches
                ? "PASS"
                : "FAIL"}
            </li>
          </ul>
        </section>
      )}
    </main>
  );
}