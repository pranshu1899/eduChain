import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import type {
  StoredAchievement,
} from "../../types/achievement";

import {
  getAchievementsByOwner,
} from "../../services/achievementService";

import {
  getConnectedWallet,
} from "../../services/evidenceService";

function shortenAddress(
  value: string,
): string {
  if (!value) {
    return "";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatDate(
  timestamp: number,
): string {
  if (!timestamp) {
    return "Unknown";
  }

  return new Date(timestamp).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function statusClass(
  status: StoredAchievement["status"],
): string {
  switch (status) {
    case "ACHIEVED":
      return "active";

    case "REVOKED":
      return "revoked";

    case "EVIDENCE_COLLECTING":
      return "active";

    default:
      return "unknown";
  }
}

export default function StudentAchievements() {
  const navigate = useNavigate();

  const [
    walletAddress,
    setWalletAddress,
  ] = useState("");

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    achievements,
    setAchievements,
  ] = useState<StoredAchievement[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadAchievements =
    useCallback(
      async (address: string) => {
        try {
          setLoading(true);
          setError("");

          setAchievements(
            getAchievementsByOwner(
              address,
            ),
          );
        } catch (loadError) {
          console.error(
            "Achievement loading failed:",
            loadError,
          );

          setError(
            "Unable to load your achievements.",
          );
        } finally {
          setLoading(false);
        }
      },
      [],
    );

  const connectWallet =
    useCallback(
      async () => {
        try {
          setError("");

          const {
            address,
          } =
            await getConnectedWallet();

          setWalletAddress(
            address,
          );

          setConnected(true);

          await loadAchievements(
            address,
          );
        } catch (walletError) {
          console.error(
            "Wallet connection failed:",
            walletError,
          );

          setConnected(false);

          setError(
            walletError instanceof Error
              ? walletError.message
              : "Wallet connection failed.",
          );

          setLoading(false);
        }
      },
      [loadAchievements],
    );

  useEffect(() => {
    void connectWallet();
  }, [connectWallet]);

  const achievedCount =
    achievements.filter(
      (item) =>
        item.status ===
        "ACHIEVED",
    ).length;

  const anchoredCount =
    achievements.filter(
      (item) =>
        Boolean(
          item.anchorTransactionHash,
        ),
    ).length;

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
            STUDENT
          </span>

          <h1>
            My Achievements
          </h1>

          <p>
            Verifiable achievements built from
            your evidence.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/student"
            className="student-view-all"
          >
            ← Student Dashboard
          </Link>

          <Link
            to="/student/achievements/create"
            className="student-connect-large"
          >
            + Create Achievement
          </Link>
        </div>
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

      {!connected ? (
        <section className="student-panel">
          <div className="student-empty">
            <div className="student-empty-icon">
              🔐
            </div>

            <h3>
              Connect your wallet
            </h3>

            <p>
              Connect the wallet used to own your
              achievements.
            </p>

            <button
              type="button"
              className="student-connect-large"
              onClick={() =>
                void connectWallet()
              }
            >
              Connect Wallet
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="student-stat-grid">
            <div className="student-stat-card purple">
              <span>
                TOTAL ACHIEVEMENTS
              </span>

              <strong>
                {achievements.length}
              </strong>

              <p>
                Achievements owned by your wallet
              </p>
            </div>

            <div className="student-stat-card green">
              <span>
                ACHIEVED
              </span>

              <strong>
                {achievedCount}
              </strong>

              <p>
                Achievements currently qualified
              </p>
            </div>

            <div className="student-stat-card yellow">
              <span>
                ANCHORED
              </span>

              <strong>
                {anchoredCount}
              </strong>

              <p>
                Achievements anchored on-chain
              </p>
            </div>

            <div className="student-stat-card red">
              <span>
                WALLET
              </span>

              <strong>
                {shortenAddress(
                  walletAddress,
                )}
              </strong>

              <p>
                Current achievement owner
              </p>
            </div>
          </section>

          <section className="student-panel">
            <div className="student-panel-header">
              <div>
                <span>
                  VERIFIABLE ACHIEVEMENTS
                </span>

                <h2>
                  Achievement Library
                </h2>

                <p>
                  Each achievement combines evidence,
                  criteria and cryptographic verification.
                </p>
              </div>

              <Link
                to="/student/achievements/create"
                className="student-view-all"
              >
                Create new →
              </Link>
            </div>

            {loading ? (
              <div className="student-loading">
                <div className="credential-loading-spinner" />

                <p>
                  Loading your achievements...
                </p>
              </div>
            ) : achievements.length === 0 ? (
              <div className="student-empty">
                <div className="student-empty-icon">
                  ◆
                </div>

                <h3>
                  No achievements yet
                </h3>

                <p>
                  Combine your evidence into a
                  verifiable achievement.
                </p>

                <Link
                  to="/student/achievements/create"
                  className="student-connect-large"
                >
                  Create Achievement
                </Link>
              </div>
            ) : (
              <div className="student-credential-grid">
                {achievements.map(
                  (
                    item,
                  ) => (
                    <article
                      key={
                        item.id
                      }
                      className="student-credential-card"
                    >
                      <div className="student-credential-top">
                        <span>
                          ACHIEVEMENT
                        </span>

                        <span
                          className={`student-status ${statusClass(
                            item.status,
                          )}`}
                        >
                          <span />

                          {item.status}
                        </span>
                      </div>

                      <h3>
                        {
                          item
                            .achievement
                            .title
                        }
                      </h3>

                      <p>
                        {
                          item
                            .achievement
                            .description
                        }
                      </p>

                      <div className="student-credential-details">
                        <div>
                          <span>
                            CREATED
                          </span>

                          <strong>
                            {formatDate(
                              item.createdAt,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            EVIDENCE
                          </span>

                          <strong>
                            {
                              item
                                .evidenceHashes
                                .length
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            QUALIFIED
                          </span>

                          <strong>
                            {item.qualified
                              ? "YES"
                              : "NO"}
                          </strong>
                        </div>
                      </div>

                      <div className="student-proof-field">
                        <span>
                          MERKLE ROOT
                        </span>

                        <code>
                          {item.merkleRoot
                            ? `${item.merkleRoot.slice(
                                0,
                                14,
                              )}...${item.merkleRoot.slice(
                                -10,
                              )}`
                            : "Not generated"}
                        </code>
                      </div>

                      <button
                        type="button"
                        className="student-connect-large"
                        onClick={() =>
                          navigate(
                            `/student/achievements/${encodeURIComponent(
                              item.id,
                            )}`,
                          )
                        }
                      >
                        View Achievement →
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}