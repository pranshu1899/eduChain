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

/* =========================================================
   STATUS HELPERS

   Contract enum:
   0 = NONE
   1 = ACTIVE
   2 = SUPERSEDED
   3 = REVOKED
   ========================================================= */

function statusText(status: number) {
  if (status === 1) return "ACTIVE";
  if (status === 2) return "SUPERSEDED";
  if (status === 3) return "REVOKED";
  if (status === 0) return "NONE";

  return "UNKNOWN";
}

function statusClass(status: number) {
  if (status === 1) return "active";
  if (status === 2) return "superseded";
  if (status === 3) return "revoked";

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

  const [credentials, setCredentials] = useState<Credential[]>([]);

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

    if (!ethereum) return;

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
            console.error(
              `Failed to load credential #${credentialId}:`,
              credentialError,
            );
          }
        }

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
     SEARCH
     ===================================================== */

  const filteredCredentials =
    credentials.filter((credential) => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) return true;

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

  const activeCount =
    credentials.filter(
      (credential) =>
        credential.status === 1,
    ).length;

  const supersededCount =
    credentials.filter(
      (credential) =>
        credential.status === 2,
    ).length;

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      <div className="credentials-page">

        {/* =================================================
            HEADER
            ================================================= */}

        <section className="credentials-page-header">

          <div className="credentials-heading">

            <span className="credentials-eyebrow">
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

          <div className="credentials-header-actions">

            <button
              type="button"
              className="credentials-refresh-button"
              onClick={() =>
                loadCredentials(true)
              }
              disabled={refreshing}
            >
              <span>
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <Link
              to="/university/issue"
              className="credentials-issue-button"
            >
              <span>
                +
              </span>

              Issue Credential
            </Link>

          </div>

        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (
          <div className="credentials-error">
            <span className="credentials-error-icon">
              !
            </span>

            <div>
              <strong>
                Unable to load credentials
              </strong>

              <p>
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            STATS
            ================================================= */}

        <section className="credentials-stats">

          <div className="credential-stat-card total">

            <div className="credential-stat-top">
              <div className="credential-stat-icon">
                #
              </div>

              <span>
                TOTAL ISSUED
              </span>
            </div>

            <strong>
              {totalIssued}
            </strong>

            <small>
              All credentials issued
            </small>

          </div>

          <div className="credential-stat-card active">

            <div className="credential-stat-top">
              <div className="credential-stat-icon">
                ✓
              </div>

              <span>
                ACTIVE
              </span>
            </div>

            <strong>
              {activeCount}
            </strong>

            <small>
              Currently valid
            </small>

          </div>

          <div className="credential-stat-card updated">

            <div className="credential-stat-top">
              <div className="credential-stat-icon">
                ↻
              </div>

              <span>
                SUPERSEDED
              </span>
            </div>

            <strong>
              {supersededCount}
            </strong>

            <small>
              Replaced by newer versions
            </small>

          </div>

          <div className="credential-stat-card revoked">

            <div className="credential-stat-top">
              <div className="credential-stat-icon">
                ×
              </div>

              <span>
                REVOKED
              </span>
            </div>

            <strong>
              {totalRevoked}
            </strong>

            <small>
              Revoked on-chain
            </small>

          </div>

        </section>

        {/* =================================================
            CREDENTIALS PANEL
            ================================================= */}

        <section className="credentials-panel">

          <div className="credentials-panel-header">

            <div>
              <span className="credentials-panel-eyebrow">
                BLOCKCHAIN RECORDS
              </span>

              <h2>
                Issued Credentials
              </h2>

              <p>
                Credential records retrieved directly
                from the EduProof contract on Sepolia.
              </p>
            </div>

            <div className="credentials-search-box">

              <span>
                ⌕
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search credentials..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              LOADING
              ================================================= */}

          {loading && (
            <div className="credentials-loading">

              <div className="credentials-spinner" />

              <h3>
                Loading credentials
              </h3>

              <p>
                Reading blockchain records from Sepolia...
              </p>

            </div>
          )}

          {/* =================================================
              EMPTY
              ================================================= */}

          {!loading &&
            credentials.length === 0 && (
              <div className="credentials-empty">

                <div className="credentials-empty-icon">
                  🎓
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
                  className="credentials-issue-button"
                >
                  + Issue First Credential
                </Link>

              </div>
            )}

          {/* =================================================
              NO SEARCH RESULTS
              ================================================= */}

          {!loading &&
            credentials.length > 0 &&
            filteredCredentials.length === 0 && (
              <div className="credentials-empty">

                <div className="credentials-empty-icon">
                  ⌕
                </div>

                <h3>
                  No matching credentials
                </h3>

                <p>
                  Try searching by credential ID,
                  student DID, degree or institution.
                </p>

                <button
                  type="button"
                  className="credentials-clear-button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  Clear Search
                </button>

              </div>
            )}

          {/* =================================================
              CREDENTIAL LIST
              ================================================= */}

          {!loading &&
            filteredCredentials.length > 0 && (
              <div className="credentials-list">

                {filteredCredentials.map(
                  (credential) => (
                    <article
                      key={credential.id}
                      className="credential-card"
                    >

                      {/* TOP */}

                      <div className="credential-card-top">

                        <div className="credential-card-identity">

                          <div className="credential-card-icon">
                            🎓
                          </div>

                          <div>

                            <span className="credential-card-type">
                              {credential.credentialType}
                            </span>

                            <h3>
                              {credential.degree}
                            </h3>

                            <p>
                              {credential.institution}
                            </p>

                          </div>

                        </div>

                        <span
                          className={`credential-status-badge ${statusClass(
                            credential.status,
                          )}`}
                        >
                          <span />

                          {statusText(
                            credential.status,
                          )}
                        </span>

                      </div>

                      {/* DIVIDER */}

                      <div className="credential-card-divider" />

                      {/* DETAILS */}

                      <div className="credential-card-details">

                        <div className="credential-detail">

                          <span>
                            CREDENTIAL ID
                          </span>

                          <strong>
                            #{credential.id}
                          </strong>

                        </div>

                        <div className="credential-detail">

                          <span>
                            STUDENT DID
                          </span>

                          <strong
                            title={
                              credential.studentDID
                            }
                          >
                            {shortDID(
                              credential.studentDID,
                            )}
                          </strong>

                        </div>

                        <div className="credential-detail">

                          <span>
                            ISSUE DATE
                          </span>

                          <strong>
                            {formatDate(
                              credential.issueDate,
                            )}
                          </strong>

                        </div>

                        <div className="credential-detail">

                          <span>
                            VERSION
                          </span>

                          <strong>
                            v{credential.version}
                          </strong>

                        </div>

                      </div>

                      {/* BOTTOM */}

                      <div className="credential-card-bottom">

                        <div className="credential-onchain">

                          <span className="onchain-dot" />

                          <span>
                            Blockchain secured
                          </span>

                          <small>
                            Sepolia
                          </small>

                        </div>

                        <Link
                          to={`/university/credentials/${credential.id}`}
                          className="credential-details-button"
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

      </div>
    </UniversityLayout>
  );
}