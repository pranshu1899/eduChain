import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import StudentLayout from "./StudentLayout";

import {
  getConnectedWallet,
  getEvidenceByOwner,
  updateStoredEvidence,
} from "../../services/evidenceService";

import {
  anchorEvidence,
} from "../../services/evidenceRegistry";

import type {
  StoredEvidence,
} from "../../types/evidence";

function shortenHash(
  value: string,
) {
  if (!value) {
    return "Not available";
  }

  if (value.length <= 28) {
    return value;
  }

  return `${value.slice(
    0,
    14,
  )}...${value.slice(-10)}`;
}

function shortenAddress(
  value: string,
) {
  if (!value) {
    return "";
  }

  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(
    0,
    6,
  )}...${value.slice(-4)}`;
}

function formatDate(
  timestamp: number,
) {
  if (!timestamp) {
    return "Unknown";
  }

  return new Date(
    timestamp,
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function statusLabel(
  status: StoredEvidence["status"],
) {
  switch (status) {
    case "SIGNED":
      return "SIGNED";

    case "ANCHORED":
      return "ANCHORED";

    case "REVOKED":
      return "REVOKED";

    default:
      return "DRAFT";
  }
}

function statusClass(
  status: StoredEvidence["status"],
) {
  switch (status) {
    case "SIGNED":
      return "active";

    case "ANCHORED":
      return "active";

    case "REVOKED":
      return "revoked";

    default:
      return "unknown";
  }
}

function getExplorerUrl(
  transactionHash: string,
) {
  return `https://sepolia.etherscan.io/tx/${transactionHash}`;
}

export default function StudentEvidence() {
  const [
    walletAddress,
    setWalletAddress,
  ] = useState("");

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    evidence,
    setEvidence,
  ] = useState<StoredEvidence[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    anchoringId,
    setAnchoringId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState("");

  const loadEvidence =
    useCallback(
      async (
        address: string,
      ) => {
        try {
          setLoading(true);
          setError("");

          const records =
            getEvidenceByOwner(
              address,
            );

          setEvidence(
            records,
          );
        } catch (loadError) {
          console.error(
            "Evidence loading failed:",
            loadError,
          );

          setError(
            "Unable to load your evidence.",
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
          const {
            address,
          } =
            await getConnectedWallet();

          setWalletAddress(
            address,
          );

          setConnected(
            true,
          );

          await loadEvidence(
            address,
          );
        } catch (walletError) {
          console.error(
            "Wallet connection failed:",
            walletError,
          );

          setError(
            walletError instanceof Error
              ? walletError.message
              : "Wallet connection failed.",
          );
        }
      },
      [loadEvidence],
    );

  useEffect(() => {
    const detectWallet =
      async () => {
        try {
          const {
            address,
          } =
            await getConnectedWallet();

          setWalletAddress(
            address,
          );

          setConnected(
            true,
          );

          await loadEvidence(
            address,
          );
        } catch {
          setConnected(
            false,
          );

          setLoading(
            false,
          );
        }
      };

    void detectWallet();
  }, [loadEvidence]);

  /**
   * Anchor a signed evidence record
   * on Ethereum Sepolia.
   */
  const handleAnchorEvidence =
    useCallback(
      async (
        item: StoredEvidence,
      ) => {
        try {
          setError("");
          setAnchoringId(
            item.id,
          );

          /*
           * Evidence must be signed before
           * it can be anchored.
           */
          if (
            item.status !==
            "SIGNED"
          ) {
            throw new Error(
              "Evidence must be signed before it can be anchored."
            );
          }

          if (
            !item.ownerVerified
          ) {
            throw new Error(
              "Evidence owner signature has not been verified."
            );
          }

          /*
           * Make sure the connected wallet
           * is the evidence owner.
           */
          const {
            address,
          } =
            await getConnectedWallet();

          if (
            address.toLowerCase() !==
            item.evidence.owner.toLowerCase()
          ) {
            throw new Error(
              "Connected wallet does not match the evidence owner."
            );
          }

          /*
           * Send evidence hash to
           * EvidenceRegistry on Sepolia.
           */
          const result =
            await anchorEvidence(
              item.evidenceHash,
            );

          /*
           * Persist the blockchain
           * anchor information locally.
           */
          const updated =
            updateStoredEvidence({
              ...item,

              status:
                "ANCHORED",

              anchorTransactionHash:
                result.transactionHash,

              anchorBlockNumber:
                result.blockNumber,
            });

          /*
           * Update UI immediately.
           */
          setEvidence(
            (current) =>
              current.map(
                (record) =>
                  record.id ===
                  updated.id
                    ? updated
                    : record,
              ),
          );

        } catch (anchorError) {
          console.error(
            "Evidence anchoring failed:",
            anchorError,
          );

          setError(
            anchorError instanceof Error
              ? anchorError.message
              : "Unable to anchor evidence on-chain.",
          );
        } finally {
          setAnchoringId(
            null,
          );
        }
      },
      [],
    );

  const signedCount =
    evidence.filter(
      (item) =>
        item.status ===
        "SIGNED",
    ).length;

  const anchoredCount =
    evidence.filter(
      (item) =>
        item.status ===
        "ANCHORED",
    ).length;

  return (
    <StudentLayout
      walletAddress={
        walletAddress
      }
      connected={
        connected
      }
      onConnect={
        connectWallet
      }
    >
      <section className="student-page-header">
        <div>
          <span className="student-page-eyebrow">
            ACHIEVEMENT EVIDENCE
          </span>

          <h1>
            My Evidence
          </h1>

          <p>
            Evidence you have created and
            cryptographically authorized.
          </p>
        </div>

        <Link
          to="/student/evidence-test"
          className="student-connect-large"
        >
          + Create Evidence
        </Link>
      </section>

      {error && (
        <section className="student-error">
          <div className="student-error-icon">
            !
          </div>

          <div>
            <strong>
              Evidence Error
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
              Connect the wallet used to create
              your achievement evidence.
            </p>

            <button
              type="button"
              className="student-connect-large"
              onClick={
                connectWallet
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
                TOTAL EVIDENCE
              </span>

              <strong>
                {evidence.length}
              </strong>

              <p>
                Evidence items owned by your wallet
              </p>
            </div>

            <div className="student-stat-card green">
              <span>
                SIGNED
              </span>

              <strong>
                {signedCount}
              </strong>

              <p>
                Evidence authorized by your wallet
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
                Evidence commitments anchored on-chain
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
                Current evidence owner
              </p>
            </div>
          </section>

          <section className="student-panel">
            <div className="student-panel-header">
              <div>
                <span>
                  CRYPTOGRAPHIC EVIDENCE
                </span>

                <h2>
                  Evidence Library
                </h2>

                <p>
                  Your achievement evidence and
                  cryptographic proof records.
                </p>
              </div>

              <Link
                to="/student/evidence-test"
                className="student-view-all"
              >
                Add evidence →
              </Link>
            </div>

            {loading ? (
              <div className="student-loading">
                <div className="credential-loading-spinner" />

                <p>
                  Loading your evidence...
                </p>
              </div>
            ) : evidence.length === 0 ? (
              <div className="student-empty">
                <div className="student-empty-icon">
                  ◇
                </div>

                <h3>
                  No evidence yet
                </h3>

                <p>
                  Create your first project,
                  course, assessment or achievement
                  evidence.
                </p>

                <Link
                  to="/student/evidence-test"
                  className="student-connect-large"
                >
                  Create Evidence
                </Link>
              </div>
            ) : (
              <div className="student-credential-grid">
                {evidence.map(
                  (item) => (
                    <article
                      key={
                        item.id
                      }
                      className="student-credential-card"
                    >
                      <div className="student-credential-top">
                        <span>
                          {
                            item.evidence.type
                          }
                        </span>

                        <span
                          className={`student-status ${statusClass(
                            item.status,
                          )}`}
                        >
                          <span />

                          {statusLabel(
                            item.status,
                          )}
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
                            SKILLS
                          </span>

                          <strong>
                            {
                              item.evidence
                                .skills
                                .length
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            OWNER
                          </span>

                          <strong>
                            {shortenAddress(
                              item.evidence
                                .owner,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div className="student-proof-field">
                        <span>
                          EVIDENCE HASH
                        </span>

                        <code>
                          {shortenHash(
                            item.evidenceHash,
                          )}
                        </code>
                      </div>

                      {item.status ===
                        "SIGNED" && (
                        <button
                          type="button"
                          className="student-connect-large"
                          onClick={() =>
                            void handleAnchorEvidence(
                              item,
                            )
                          }
                          disabled={
                            anchoringId ===
                            item.id
                          }
                        >
                          {anchoringId ===
                          item.id
                            ? "Anchoring on Sepolia..."
                            : "Anchor Evidence on Blockchain"}
                        </button>
                      )}

                      {item.status ===
                        "ANCHORED" && (
                        <div className="student-proof-field">
                          <span>
                            BLOCKCHAIN ANCHOR
                          </span>

                          <strong>
                            ✓ Confirmed on Sepolia
                          </strong>

                          {item.anchorBlockNumber !==
                            undefined && (
                            <small>
                              Block{" "}
                              {
                                item.anchorBlockNumber
                              }
                            </small>
                          )}

                          {item.anchorTransactionHash && (
                            <a
                              href={getExplorerUrl(
                                item.anchorTransactionHash,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View transaction ↗
                            </a>
                          )}
                        </div>
                      )}

                      {item.status !==
                        "SIGNED" &&
                        item.status !==
                          "ANCHORED" && (
                          <div className="student-card-action">
                            Cryptographic proof recorded

                            <span>
                              ✓
                            </span>
                          </div>
                        )}
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}
    </StudentLayout>
  );
}