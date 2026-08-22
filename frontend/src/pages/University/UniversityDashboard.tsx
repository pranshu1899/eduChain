import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import UniversityStats from "../../components/university/UniversityStats";
import StudentCredentialCard from "../../components/university/StudentCredentialCard";
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
  const navigate = useNavigate();

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

      <section className="university-page-header">
        <div>
          <span className="page-eyebrow">
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

        <div className="university-page-actions">
          <Link
            to="/university/verify"
            className="secondary-button"
          >
            Verify Credential
          </Link>

          <Link
            to="/university/issue"
            className="primary-button"
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

      <section className="university-dashboard-grid">

        {/* =================================================
            RECENT CREDENTIALS
            ================================================= */}

        <div className="university-panel">

          <div className="university-panel-header">
            <div>
              <h2>
                Recent Credentials
              </h2>

              <p>
                Latest credentials issued by your
                institution.
              </p>
            </div>

            <Link
              to="/university/credentials"
              className="panel-link"
            >
              View all →
            </Link>
          </div>

          {credentialsLoading ? (
            <div className="university-empty-state">
              <div className="credential-loading-spinner" />

              <h3>
                Loading credentials...
              </h3>

              <p>
                Reading credential records from the
                EduProof contract on Sepolia.
              </p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="university-empty-state">
              <div className="empty-state-icon">
                ▣
              </div>

              <h3>
                No credentials issued
              </h3>

              <p>
                Credentials issued by this university
                will appear here.
              </p>

              <Link
                to="/university/issue"
                className="secondary-button"
              >
                Issue Credential
              </Link>
            </div>
          ) : (
            <div className="university-credentials-list">
              {credentials.map(
                (credential) => (
                  <StudentCredentialCard
                    key={credential.id}
                    id={credential.id}
                    studentDID={
                      credential.studentDID
                    }
                    credentialType={
                      credential.credentialType
                    }
                    degree={
                      credential.degree
                    }
                    institution={
                      credential.institution
                    }
                    issueDate={
                      credential.issueDate
                    }
                    version={
                      credential.version
                    }
                    status={
                      credential.status
                    }
                    onView={(id) => {
                      navigate(
                        `/university/credentials/${id}`
                      );
                    }}
                  />
                )
              )}
            </div>
          )}

        </div>

        {/* =================================================
            QUICK ACTIONS
            ================================================= */}

        <div className="university-panel">

          <div className="university-panel-header">
            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Common university operations.
              </p>
            </div>
          </div>

          <Link
            to="/university/issue"
            className="university-action-card"
          >
            <div className="action-icon purple">
              +
            </div>

            <div>
              <strong>
                Issue Credential
              </strong>

              <span>
                Create a new academic credential
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/university/credentials"
            className="university-action-card"
          >
            <div className="action-icon blue">
              ▣
            </div>

            <div>
              <strong>
                Manage Credentials
              </strong>

              <span>
                View and manage issued records
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>

          <Link
            to="/university/verify"
            className="university-action-card"
          >
            <div className="action-icon green">
              ✓
            </div>

            <div>
              <strong>
                Verify Credential
              </strong>

              <span>
                Validate an existing credential
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>

        </div>
      </section>

      {/* =================================================
          CONNECTED WALLET
          ================================================= */}

      {walletAddress && (
        <div className="university-wallet-info">
          Connected issuer:

          <code>
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