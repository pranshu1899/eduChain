import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import UniversityStats from "../../components/university/UniversityStats";
import { getReadOnlyContract } from "../../services/eduProof";

interface LocalEthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on(
    event: string,
    handler: (...args: unknown[]) => void
  ): void;

  removeListener(
    event: string,
    handler: (...args: unknown[]) => void
  ): void;
}

interface Analytics {
  issued: number;
  updated: number;
  revoked: number;
}

interface BlockchainCredential {
  id: number;
  studentDID: string;
  credentialType: string;
  institution: string;
  degree: string;
  issueDate: string;
  version: number;
  status: number;
}

function getEthereum(): LocalEthereumProvider | null {
  const ethereum = (
    window as Window & {
      ethereum?: LocalEthereumProvider;
    }
  ).ethereum;

  return ethereum ?? null;
}

function shortAddress(address: string) {
  if (!address) {
    return "Not connected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function UniversityDashboard() {

  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [analytics, setAnalytics] = useState<Analytics>({
    issued: 0,
    updated: 0,
    revoked: 0,
  });

  const [credentials, setCredentials] = useState<
    BlockchainCredential[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [credentialsLoading, setCredentialsLoading] =
    useState(true);

  const [contractError, setContractError] = useState("");

  /* =====================================================
     WALLET DETECTION
     ===================================================== */

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setConnected(false);
      setWalletAddress("");
      setLoading(false);
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
        } else {
          setWalletAddress("");
          setConnected(false);
        }
      } catch (error) {
        console.error(
          "Wallet detection failed:",
          error
        );

        setWalletAddress("");
        setConnected(false);
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
      handleAccountsChanged
    );

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  /* =====================================================
     LOAD UNIVERSITY ANALYTICS
     ===================================================== */

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setContractError("");

        const contract = getReadOnlyContract();

        const result =
          await contract.getIssuerAnalytics(
            walletAddress
          );

        setAnalytics({
          issued: Number(result[0]),
          updated: Number(result[1]),
          revoked: Number(result[2]),
        });
      } catch (error) {
        console.error(
          "Failed to load blockchain analytics:",
          error
        );

        setContractError(
          "Unable to load blockchain analytics."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [walletAddress]);

  /* =====================================================
     LOAD RECENT BLOCKCHAIN CREDENTIALS
     ===================================================== */

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        setCredentialsLoading(true);

        const contract = getReadOnlyContract();

        const totalRaw =
          await contract.totalCredentialsIssued();

        const total = Number(totalRaw);

        if (total <= 0) {
          setCredentials([]);
          return;
        }

        /*
         * Show the five newest credential IDs.
         *
         * Credential IDs start from 1.
         */
        const firstId = Math.max(
          1,
          total - 4
        );

        const ids: number[] = [];

        for (
          let id = total;
          id >= firstId;
          id--
        ) {
          ids.push(id);
        }

        const loadedCredentials =
          await Promise.all(
            ids.map(async (id) => {
              try {
                const credential =
                  await contract.getCredential(id);

                return {
                  id,

                  studentDID: String(
                    credential.studentDID
                  ),

                  credentialType: String(
                    credential.credentialType
                  ),

                  institution: String(
                    credential.institution
                  ),

                  degree: String(
                    credential.degree
                  ),

                  issueDate: String(
                    credential.issueDate
                  ),

                  version: Number(
                    credential.version
                  ),

                  status: Number(
                    credential.status
                  ),
                };
              } catch (error) {
                console.error(
                  `Failed to load credential ${id}:`,
                  error
                );

                return null;
              }
            })
          );

        const validCredentials =
          loadedCredentials.filter(
            (
              credential
            ): credential is BlockchainCredential =>
              credential !== null
          );

        setCredentials(validCredentials);
      } catch (error) {
        console.error(
          "Failed to load credentials:",
          error
        );

        setCredentials([]);
      } finally {
        setCredentialsLoading(false);
      }
    };

    loadCredentials();
  }, []);

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <section className="dashboard-page-header">
        <div>
          <span className="dashboard-eyebrow">
            UNIVERSITY OVERVIEW
          </span>

          <h1>
            University Dashboard
          </h1>

          <p>
            Manage academic credentials, monitor issuance
            activity and verify blockchain records.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            to="/university/verify"
            className="dashboard-btn-secondary"
          >
            Verify Credential
          </Link>

          <Link
            to="/university/issue"
            className="dashboard-btn-primary"
          >
            + Issue Credential
          </Link>
        </div>
      </section>

      {/* =================================================
          BLOCKCHAIN ERROR
          ================================================= */}

      {contractError && (
        <div className="blockchain-error">
          {contractError}
        </div>
      )}

      {/* =================================================
          BLOCKCHAIN STATISTICS
          ================================================= */}

      <UniversityStats
        total={analytics.issued}
        active={Math.max(
          analytics.issued - analytics.revoked,
          0
        )}
        superseded={analytics.updated}
        revoked={analytics.revoked}
      />

      {/* =================================================
          LOWER DASHBOARD
          ================================================= */}

      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px", marginTop: "32px" }}>

        {/* =================================================
            RECENT CREDENTIALS
            ================================================= */}

        <div style={{ display: "flex", flexDirection: "column" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
            <div>
              <h2 style={{ fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 4px" }}>
                Recent Credentials
              </h2>

              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "14px" }}>
                Latest credentials issued by your
                institution.
              </p>
            </div>

            <Link
              to="/university/credentials"
              className="dashboard-btn-secondary"
              style={{ textDecoration: "none" }}
            >
              View all →
            </Link>
          </div>

          {credentialsLoading ? (
            <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Loading credentials...</h3>
              <p style={{ margin: 0, color: "var(--text-soft)" }}>Reading credential records from the EduProof contract on Sepolia.</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>📝</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>No credentials issued</h3>
            <p style={{ margin: "0 0 24px", color: "var(--text-soft)" }}>This university hasn't issued any blockchain credentials yet.</p>
            <Link to="/university/issue" className="dashboard-btn-primary" style={{ textDecoration: "none" }}>
              Issue first credential →
            </Link>
          </div>
          ) : (
            <div className="dashboard-table-container">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>DEGREE</th>
                  <th>STUDENT DID</th>
                  <th>DATE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr key={cred.id}>
                    <td>
                      <div className={`dashboard-badge ${cred.status === 2 ? 'error' : (cred.status === 1 ? 'info' : 'success')}`}>
                        {cred.status === 2 ? "Revoked" : (cred.status === 1 ? "Updated" : "Valid")}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text)" }}>{cred.degree}</td>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {cred.studentDID.slice(0, 10)}...{cred.studentDID.slice(-4)}
                    </td>
                    <td>{cred.issueDate}</td>
                    <td>
                      <Link to={`/university/credentials/${cred.id}`} style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600, fontSize: "13px" }}>
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

        </div>

        {/* =================================================
            QUICK ACTIONS
            ================================================= */}

        <div className="dashboard-card">

          <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 4px" }}>
                Quick Actions
              </h2>
              <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "14px" }}>
                Common university operations.
              </p>
          </div>

          <Link
            to="/university/issue"
            className="dashboard-card"
            style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", marginBottom: "16px", background: "var(--bg-surface)" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(139, 92, 246, 0.1)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: "20px" }}>
              +
            </div>

            <div>
              <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>
                Issue Credential
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                Create a new blockchain record.
              </span>
            </div>
          </Link>

          <Link
            to="/university/credentials"
            className="dashboard-card"
            style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", marginBottom: "16px", background: "var(--bg-surface)" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.1)", color: "var(--secondary)", display: "grid", placeItems: "center", fontSize: "20px" }}>
              ▣
            </div>

            <div>
              <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>
                Manage Credentials
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                View and manage issued records
              </span>
            </div>
          </Link>

          <Link
            to="/university/verify"
            className="dashboard-card"
            style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", background: "var(--bg-surface)" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(52, 211, 153, 0.1)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: "20px" }}>
              ✓
            </div>

            <div>
              <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>
                Verify Credential
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-soft)" }}>
                Validate an existing credential
              </span>
            </div>
          </Link>

        </div>
      </section>

      {/* =================================================
          CONNECTED WALLET
          ================================================= */}

      {walletAddress && (
        <div style={{ marginTop: "48px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Connected issuer:</span>
          <code style={{ background: "rgba(255,255,255,0.05)", padding: "4px 8px", borderRadius: "6px" }}>
            {shortAddress(walletAddress)}
          </code>

          {loading && (
            <span>
              {" "}
              • Syncing blockchain data...
            </span>
          )}
        </div>
      )}
    </UniversityLayout>
  );
}