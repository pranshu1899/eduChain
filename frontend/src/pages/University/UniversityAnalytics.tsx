import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import { getReadOnlyContract } from "../../services/eduProof";

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

interface IssuerData {
  wallet: string;
  institutionName: string;
  institutionId: string;
  status: number;
}

interface IssuerAnalytics {
  issued: number;
  updated: number;
  revoked: number;
}

interface GlobalAnalytics {
  credentialsIssued: number;
  credentialsUpdated: number;
  credentialsRevoked: number;
  issuersRegistered: number;
  issuersAuthorized: number;
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

  if (address.length <= 16) {
    return address;
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function issuerStatusText(status: number) {
  if (status === 0) {
    return "REGISTERED";
  }

  if (status === 1) {
    return "AUTHORIZED";
  }

  if (status === 2) {
    return "SUSPENDED";
  }

  return "UNKNOWN";
}

function issuerStatusClass(status: number) {
  if (status === 1) {
    return "authorized";
  }

  if (status === 2) {
    return "suspended";
  }

  return "registered";
}

export default function UniversityAnalytics() {
  const [walletAddress, setWalletAddress] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const [issuer, setIssuer] =
    useState<IssuerData | null>(null);

  const [issuerAnalytics, setIssuerAnalytics] =
    useState<IssuerAnalytics>({
      issued: 0,
      updated: 0,
      revoked: 0,
    });

  const [globalAnalytics, setGlobalAnalytics] =
    useState<GlobalAnalytics>({
      credentialsIssued: 0,
      credentialsUpdated: 0,
      credentialsRevoked: 0,
      issuersRegistered: 0,
      issuersAuthorized: 0,
    });

  const [authorized, setAuthorized] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  /* =====================================================
     WALLET
     ===================================================== */

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setLoading(false);
      return;
    }

    const loadWallet = async () => {
      try {
        const accounts =
          (await ethereum.request({
            method: "eth_accounts",
          })) as string[];

        if (
          accounts.length > 0
        ) {
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
      const accounts =
        args[0] as
          | string[]
          | undefined;

      if (
        accounts &&
        accounts.length > 0
      ) {
        setWalletAddress(accounts[0]);
        setConnected(true);
      } else {
        setWalletAddress("");
        setConnected(false);
        setIssuer(null);
        setAuthorized(false);
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
     LOAD ANALYTICS
     ===================================================== */

  const loadAnalytics = useCallback(
    async (
      isRefresh = false,
    ) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const contract =
          getReadOnlyContract();

        /*
         * Global analytics do not require
         * a connected wallet.
         */

        const global =
          await contract.getGlobalAnalytics();

        setGlobalAnalytics({
          credentialsIssued:
            Number(
              global.credentialsIssued,
            ),

          credentialsUpdated:
            Number(
              global.credentialsUpdated,
            ),

          credentialsRevoked:
            Number(
              global.credentialsRevoked,
            ),

          issuersRegistered:
            Number(
              global.issuersRegistered,
            ),

          issuersAuthorized:
            Number(
              global.issuersAuthorized,
            ),
        });

        /*
         * Issuer-specific analytics require
         * the currently connected wallet.
         */

        if (walletAddress) {
          try {
            const [
              issuerResult,
              issuerStats,
              issuerAuthorized,
            ] = await Promise.all([
              contract.getIssuer(
                walletAddress,
              ),

              contract.getIssuerAnalytics(
                walletAddress,
              ),

              contract.isAuthorizedIssuer(
                walletAddress,
              ),
            ]);

            setIssuer({
              wallet:
                String(
                  issuerResult.wallet,
                ),

              institutionName:
                String(
                  issuerResult.institutionName,
                ),

              institutionId:
                String(
                  issuerResult.institutionId,
                ),

              status:
                Number(
                  issuerResult.status,
                ),
            });

            setIssuerAnalytics({
              issued:
                Number(
                  issuerStats.issued,
                ),

              updated:
                Number(
                  issuerStats.updated,
                ),

              revoked:
                Number(
                  issuerStats.revoked,
                ),
            });

            setAuthorized(
              Boolean(
                issuerAuthorized,
              ),
            );
          } catch (issuerError) {
            console.error(
              "Issuer analytics unavailable:",
              issuerError,
            );

            setIssuer(null);
            setAuthorized(false);
          }
        } else {
          setIssuer(null);
          setAuthorized(false);

          setIssuerAnalytics({
            issued: 0,
            updated: 0,
            revoked: 0,
          });
        }
      } catch (analyticsError) {
        console.error(
          "Analytics loading failed:",
          analyticsError,
        );

        setError(
          "Unable to load analytics from the EduProof contract.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  /* =====================================================
     DERIVED VALUES
     ===================================================== */

  const activeCredentials =
    Math.max(
      issuerAnalytics.issued -
        issuerAnalytics.revoked,
      0,
    );

  const issuerActivityTotal =
    issuerAnalytics.issued +
    issuerAnalytics.updated +
    issuerAnalytics.revoked;

  const globalActive =
    Math.max(
      globalAnalytics.credentialsIssued -
        globalAnalytics.credentialsRevoked,
      0,
    );

  const issuancePercentage =
    globalAnalytics.credentialsIssued > 0
      ? Math.round(
          (issuerAnalytics.issued /
            globalAnalytics.credentialsIssued) *
            100,
        )
      : 0;

  const revokePercentage =
    issuerAnalytics.issued > 0
      ? Math.round(
          (issuerAnalytics.revoked /
            issuerAnalytics.issued) *
            100,
        )
      : 0;

  /* =====================================================
     PAGE
     ===================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <section className="university-page-header">
        <div>
          <span className="page-eyebrow">
            UNIVERSITY ANALYTICS
          </span>

          <h1>
            Analytics
          </h1>

          <p>
            Monitor credential activity and issuer
            statistics directly from the blockchain.
          </p>
        </div>

        <div className="university-page-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              loadAnalytics(true)
            }
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
          WALLET / ISSUER STATUS
          ================================================= */}

      {!connected ? (
        <section className="analytics-connect-card">
          <div className="analytics-connect-icon">
            ◈
          </div>

          <div>
            <span className="page-eyebrow">
              ISSUER CONNECTION
            </span>

            <h2>
              Connect your university wallet
            </h2>

            <p>
              Global platform analytics are available,
              but issuer-specific statistics require
              the university wallet.
            </p>
          </div>
        </section>
      ) : (
        <section className="analytics-issuer-card">

          <div className="analytics-issuer-identity">

            <div className="analytics-institution-icon">
              🏛️
            </div>

            <div>
              <span className="page-eyebrow">
                CURRENT ISSUER
              </span>

              <h2>
                {issuer?.institutionName ||
                  "University Issuer"}
              </h2>

              <p>
                {issuer?.institutionId ||
                  "Institution ID unavailable"}
              </p>
            </div>

          </div>

          <div className="analytics-issuer-meta">

            <div>
              <span>
                WALLET
              </span>

              <strong>
                {shortAddress(
                  walletAddress,
                )}
              </strong>
            </div>

            <div>
              <span>
                AUTHORIZATION
              </span>

              <strong
                className={
                  authorized
                    ? "analytics-authorized"
                    : "analytics-not-authorized"
                }
              >
                {authorized
                  ? "✓ Authorized"
                  : "Not Authorized"}
              </strong>
            </div>

            {issuer && (
              <div>
                <span>
                  ISSUER STATUS
                </span>

                <strong
                  className={`analytics-status ${issuerStatusClass(
                    issuer.status,
                  )}`}
                >
                  {issuerStatusText(
                    issuer.status,
                  )}
                </strong>
              </div>
            )}

          </div>

        </section>
      )}

      {/* =================================================
          ISSUER STATISTICS
          ================================================= */}

      <section className="analytics-section">

        <div className="analytics-section-heading">
          <div>
            <span className="page-eyebrow">
              ISSUER PERFORMANCE
            </span>

            <h2>
              Credential Activity
            </h2>
          </div>

          <span className="analytics-live-indicator">
            <span />
            Blockchain data
          </span>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="credential-loading-spinner" />

            <p>
              Reading issuer analytics...
            </p>
          </div>
        ) : (
          <div className="analytics-stat-grid">

            <div className="analytics-stat-card purple">
              <div className="analytics-stat-top">
                <span>
                  ISSUED
                </span>

                <div className="analytics-stat-icon">
                  ↑
                </div>
              </div>

              <strong>
                {issuerAnalytics.issued}
              </strong>

              <p>
                Credentials issued by this university
              </p>
            </div>

            <div className="analytics-stat-card blue">
              <div className="analytics-stat-top">
                <span>
                  UPDATED
                </span>

                <div className="analytics-stat-icon">
                  ↻
                </div>
              </div>

              <strong>
                {issuerAnalytics.updated}
              </strong>

              <p>
                Credential update operations
              </p>
            </div>

            <div className="analytics-stat-card green">
              <div className="analytics-stat-top">
                <span>
                  ACTIVE
                </span>

                <div className="analytics-stat-icon">
                  ✓
                </div>
              </div>

              <strong>
                {activeCredentials}
              </strong>

              <p>
                Currently active credentials
              </p>
            </div>

            <div className="analytics-stat-card red">
              <div className="analytics-stat-top">
                <span>
                  REVOKED
                </span>

                <div className="analytics-stat-icon">
                  ×
                </div>
              </div>

              <strong>
                {issuerAnalytics.revoked}
              </strong>

              <p>
                Credentials revoked by issuer
              </p>
            </div>

          </div>
        )}

      </section>

      {/* =================================================
          ACTIVITY VISUALIZATION
          ================================================= */}

      <section className="analytics-content-grid">

        <div className="university-panel analytics-breakdown-panel">

          <div className="credential-section-heading">
            <div>
              <span className="page-eyebrow">
                ACTIVITY BREAKDOWN
              </span>

              <h2>
                Issuer Operations
              </h2>

              <p>
                Current activity recorded by EduProof.
              </p>
            </div>
          </div>

          <div className="analytics-bars">

            <div className="analytics-bar-row">

              <div className="analytics-bar-label">
                <span>
                  Issued
                </span>

                <strong>
                  {issuerAnalytics.issued}
                </strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill issued"
                  style={{
                    width: `${
                      issuerActivityTotal > 0
                        ? (issuerAnalytics.issued /
                            issuerActivityTotal) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>

            <div className="analytics-bar-row">

              <div className="analytics-bar-label">
                <span>
                  Updated
                </span>

                <strong>
                  {issuerAnalytics.updated}
                </strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill updated"
                  style={{
                    width: `${
                      issuerActivityTotal > 0
                        ? (issuerAnalytics.updated /
                            issuerActivityTotal) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>

            <div className="analytics-bar-row">

              <div className="analytics-bar-label">
                <span>
                  Revoked
                </span>

                <strong>
                  {issuerAnalytics.revoked}
                </strong>
              </div>

              <div className="analytics-bar-track">
                <div
                  className="analytics-bar-fill revoked"
                  style={{
                    width: `${
                      issuerActivityTotal > 0
                        ? (issuerAnalytics.revoked /
                            issuerActivityTotal) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            KEY METRICS
            ================================================= */}

        <div className="university-panel analytics-metrics-panel">

          <div className="credential-section-heading">
            <div>
              <span className="page-eyebrow">
                KEY METRICS
              </span>

              <h2>
                Issuer Insights
              </h2>
            </div>
          </div>

          <div className="analytics-insight-list">

            <div className="analytics-insight">
              <div className="analytics-insight-icon">
                %
              </div>

              <div>
                <span>
                  PLATFORM SHARE
                </span>

                <strong>
                  {issuancePercentage}%
                </strong>

                <p>
                  Of all credentials issued on
                  EduProof
                </p>
              </div>
            </div>

            <div className="analytics-insight">
              <div className="analytics-insight-icon">
                !
              </div>

              <div>
                <span>
                  REVOCATION RATE
                </span>

                <strong>
                  {revokePercentage}%
                </strong>

                <p>
                  Based on this issuer's issued
                  credentials
                </p>
              </div>
            </div>

            <div className="analytics-insight">
              <div className="analytics-insight-icon">
                #
              </div>

              <div>
                <span>
                  TOTAL ACTIVITY
                </span>

                <strong>
                  {issuerActivityTotal}
                </strong>

                <p>
                  Issuance, update and revoke operations
                </p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          GLOBAL PLATFORM ANALYTICS
          ================================================= */}

      <section className="university-panel analytics-global-panel">

        <div className="analytics-section-heading">
          <div>
            <span className="page-eyebrow">
              EDUPROOF NETWORK
            </span>

            <h2>
              Global Platform Statistics
            </h2>

            <p>
              Aggregate statistics returned by the
              EduProof smart contract.
            </p>
          </div>
        </div>

        <div className="analytics-global-grid">

          <div className="analytics-global-item">
            <span>
              CREDENTIALS ISSUED
            </span>

            <strong>
              {globalAnalytics.credentialsIssued}
            </strong>
          </div>

          <div className="analytics-global-item">
            <span>
              CREDENTIALS UPDATED
            </span>

            <strong>
              {globalAnalytics.credentialsUpdated}
            </strong>
          </div>

          <div className="analytics-global-item">
            <span>
              CREDENTIALS REVOKED
            </span>

            <strong>
              {globalAnalytics.credentialsRevoked}
            </strong>
          </div>

          <div className="analytics-global-item">
            <span>
              ACTIVE CREDENTIALS
            </span>

            <strong>
              {globalActive}
            </strong>
          </div>

          <div className="analytics-global-item">
            <span>
              REGISTERED ISSUERS
            </span>

            <strong>
              {globalAnalytics.issuersRegistered}
            </strong>
          </div>

          <div className="analytics-global-item">
            <span>
              AUTHORIZED ISSUERS
            </span>

            <strong>
              {globalAnalytics.issuersAuthorized}
            </strong>
          </div>

        </div>

      </section>

    </UniversityLayout>
  );
}