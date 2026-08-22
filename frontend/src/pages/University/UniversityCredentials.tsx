import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import { getReadOnlyContract } from "../../services/eduProof";

interface Credential {
  id: number;
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  version: number;
  status: number;
  issuer: string;
  cid: string;
}

interface LocalEthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;

  removeListener(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;
}

interface CredentialContractResult {
  id: bigint;
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  version: bigint;
  status: bigint;
  issuer: string;
  cid: string;
}

function getEthereum(): LocalEthereumProvider | null {
  const ethereum = (
    window as Window & {
      ethereum?: LocalEthereumProvider;
    }
  ).ethereum;

  return ethereum ?? null;
}

function statusText(status: number) {
  if (status === 0) return "ACTIVE";
  if (status === 1) return "REVOKED";
  if (status === 2) return "SUPERSEDED";

  return "UNKNOWN";
}

function statusClass(status: number) {
  if (status === 0) return "active";
  if (status === 1) return "revoked";
  if (status === 2) return "superseded";

  return "unknown";
}

function formatDate(date: string) {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortDID(did: string) {
  if (!did) return "Unknown";

  if (did.length <= 32) {
    return did;
  }

  return `${did.slice(0, 18)}...${did.slice(-10)}`;
}

function getCredentialFromResult(
  result: CredentialContractResult,
): Credential {
  return {
    id: Number(result.id),
    studentDID: String(result.studentDID),
    credentialType: String(result.credentialType),
    institution: String(result.institution),
    institutionId: String(result.institutionId),
    degree: String(result.degree),
    issueDate: String(result.issueDate),
    version: Number(result.version),
    status: Number(result.status),
    issuer: String(result.issuer),
    cid: String(result.cid),
  };
}

export default function UniversityCredentials() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [credentials, setCredentials] = useState<
    Credential[]
  >([]);

  const [totalIssued, setTotalIssued] = useState(0);
  const [totalRevoked, setTotalRevoked] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  /* =====================================================
     WALLET
     ===================================================== */

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      return;
    }

    const loadWallet = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
        }
      } catch (walletError) {
        console.error(
          "Wallet detection failed:",
          walletError,
        );
      }
    };

    const handleAccountsChanged = (
      ...args: unknown[]
    ) => {
      const accounts = args[0] as
        | string[]
        | undefined;

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setConnected(true);
      } else {
        setWalletAddress("");
        setConnected(false);
      }
    };

    loadWallet();

    ethereum.on(
      "accountsChanged",
      handleAccountsChanged,
    );

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged,
      );
    };
  }, []);

  /* =====================================================
     LOAD CREDENTIALS
     ===================================================== */

  const loadCredentials = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const contract = getReadOnlyContract();

        /*
         * Your contract exposes totalCredentialsIssued()
         * rather than a getAllCredentials() function.
         *
         * Therefore we read credential IDs from 1 to total.
         */

        const [
          issued,
          revoked,
          updated,
        ] = await Promise.all([
          contract.totalCredentialsIssued(),
          contract.totalCredentialsRevoked(),
          contract.totalCredentialsUpdated(),
        ]);

        const issuedCount = Number(issued);
        const revokedCount = Number(revoked);
        const updatedCount = Number(updated);

        setTotalIssued(issuedCount);
        setTotalRevoked(revokedCount);
        setTotalUpdated(updatedCount);

        if (issuedCount === 0) {
          setCredentials([]);
          return;
        }

        const loaded: Credential[] = [];

        /*
         * Fetch credentials individually.
         *
         * This matches the ABI currently available in
         * your eduProof service.
         */

        for (
          let credentialId = 1;
          credentialId <= issuedCount;
          credentialId += 1
        ) {
          try {
            const result =
              (await contract.getCredential(
                credentialId,
              )) as CredentialContractResult;

            loaded.push(
              getCredentialFromResult(result),
            );
          } catch (credentialError) {
            /*
             * One invalid/missing record should not prevent
             * the remaining credentials from appearing.
             */

            console.error(
              `Failed to load credential #${credentialId}:`,
              credentialError,
            );
          }
        }

        /*
         * Newest credentials first.
         */

        loaded.sort((a, b) => b.id - a.id);

        setCredentials(loaded);
      } catch (loadError) {
        console.error(
          "Failed to load credentials:",
          loadError,
        );

        setError(
          "Unable to load credentials from the EduProof contract.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadCredentials();
  }, [loadCredentials]);

  /* =====================================================
     FILTER
     ===================================================== */

  const filteredCredentials =
    credentials.filter((credential) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return true;
      }

      return (
        credential.studentDID
          .toLowerCase()
          .includes(query) ||
        credential.degree
          .toLowerCase()
          .includes(query) ||
        credential.credentialType
          .toLowerCase()
          .includes(query) ||
        credential.institution
          .toLowerCase()
          .includes(query) ||
        String(credential.id).includes(query)
      );
    });

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <section className="university-page-header">
        <div>
          <span className="page-eyebrow">
            CREDENTIAL MANAGEMENT
          </span>

          <h1>
            Credentials
          </h1>

          <p>
            View and manage academic credentials issued
            by your institution.
          </p>
        </div>

        <div className="university-page-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => loadCredentials(true)}
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          <Link
            to="/university/issue"
            className="primary-button"
          >
            + Issue Credential
          </Link>
        </div>
      </section>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="blockchain-error">
          {error}
        </div>
      )}

      {/* =================================================
          STATISTICS
          ================================================= */}

      <section className="credentials-stat-grid">

        <div className="credential-stat-card">
          <div className="credential-stat-icon purple">
            #
          </div>

          <div>
            <span>
              TOTAL ISSUED
            </span>

            <strong>
              {totalIssued}
            </strong>
          </div>
        </div>

        <div className="credential-stat-card">
          <div className="credential-stat-icon green">
            ✓
          </div>

          <div>
            <span>
              ACTIVE
            </span>

            <strong>
              {Math.max(
                totalIssued - totalRevoked,
                0,
              )}
            </strong>
          </div>
        </div>

        <div className="credential-stat-card">
          <div className="credential-stat-icon blue">
            ↻
          </div>

          <div>
            <span>
              UPDATED
            </span>

            <strong>
              {totalUpdated}
            </strong>
          </div>
        </div>

        <div className="credential-stat-card">
          <div className="credential-stat-icon red">
            ×
          </div>

          <div>
            <span>
              REVOKED
            </span>

            <strong>
              {totalRevoked}
            </strong>
          </div>
        </div>

      </section>

      {/* =================================================
          CREDENTIAL LIST
          ================================================= */}

      <section className="university-panel credentials-list-panel">

        <div className="university-panel-header credentials-toolbar">

          <div>
            <h2>
              Issued Credentials
            </h2>

            <p>
              Blockchain records retrieved from Sepolia.
            </p>
          </div>

          <div className="credentials-search">
            <span>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search credentials..."
            />
          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="credentials-loading">
            <div className="credential-loading-spinner" />

            <h3>
              Loading credentials...
            </h3>

            <p>
              Reading credential records from
              EduProof on Sepolia.
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          credentials.length === 0 && (
            <div className="university-empty-state">
              <div className="empty-state-icon">
                ▣
              </div>

              <h3>
                No credentials issued yet
              </h3>

              <p>
                Credentials issued by your institution
                will appear here.
              </p>

              <Link
                to="/university/issue"
                className="primary-button"
              >
                Issue First Credential
              </Link>
            </div>
          )}

        {/* NO SEARCH RESULTS */}

        {!loading &&
          credentials.length > 0 &&
          filteredCredentials.length === 0 && (
            <div className="credentials-no-results">
              <div className="empty-state-icon">
                ⌕
              </div>

              <h3>
                No matching credentials
              </h3>

              <p>
                Try searching by student DID, degree,
                credential type or credential ID.
              </p>
            </div>
          )}

        {/* CREDENTIAL CARDS */}

        {!loading &&
          filteredCredentials.length > 0 && (
            <div className="credentials-card-list">

              {filteredCredentials.map(
                (credential) => (
                  <article
                    key={credential.id}
                    className="credential-list-card"
                  >

                    <div className="credential-list-main">

                      <div className="credential-list-icon">
                        🎓
                      </div>

                      <div className="credential-list-info">

                        <div className="credential-list-title-row">

                          <div>
                            <span className="credential-list-type">
                              {credential.credentialType}
                            </span>

                            <h3>
                              {credential.degree}
                            </h3>
                          </div>

                          <span
                            className={`credential-status ${statusClass(
                              credential.status,
                            )}`}
                          >
                            <span className="credential-status-dot" />

                            {statusText(
                              credential.status,
                            )}
                          </span>

                        </div>

                        <div className="credential-list-meta">

                          <div>
                            <span>
                              CREDENTIAL
                            </span>

                            <strong>
                              #{credential.id}
                            </strong>
                          </div>

                          <div>
                            <span>
                              STUDENT DID
                            </span>

                            <strong>
                              {shortDID(
                                credential.studentDID,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              ISSUE DATE
                            </span>

                            <strong>
                              {formatDate(
                                credential.issueDate,
                              )}
                            </strong>
                          </div>

                          <div>
                            <span>
                              VERSION
                            </span>

                            <strong>
                              v{credential.version}
                            </strong>
                          </div>

                        </div>

                      </div>

                    </div>

                    <div className="credential-list-actions">

                      <div className="credential-chain-indicator">
                        <span className="chain-dot" />

                        On-chain
                      </div>

                      <Link
                        to={`/university/credentials/${credential.id}`}
                        className="credential-view-button"
                      >
                        View Details
                        <span>
                          →
                        </span>
                      </Link>

                    </div>

                  </article>
                ),
              )}

            </div>
          )}

      </section>
    </UniversityLayout>
  );
}