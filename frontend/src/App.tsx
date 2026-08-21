import { useEffect, useState } from "react";
import { connectWallet } from "./config/web3";

import {
  verifyCredential,
  issueCredential,
  updateCredential,
  getAllCredentials,
  getCredentialVersionHistory,
  type Credential,
} from "./config/contractService";

import "./App.css";

type Page =
  | "dashboard"
  | "credentials"
  | "issue"
  | "verify"
  | "analytics";

interface VerificationResult {
  verified: boolean;
  credential: Credential;
  verifiableCredential: any;
  checks: {
    hashMatches: boolean;
    signatureValid: boolean;
    issuerAuthorized: boolean;
    credentialActive: boolean;
    studentDIDMatches: boolean;
    issuerDIDPresent: boolean;
  };
}

interface IssueSuccess {
  credentialId: number | null;
  transactionHash: string;
  ipfsUri: string;
}

interface UpdateSuccess {
  previousCredentialId: number;
  credentialId: number | null;
  version: number;
  transactionHash: string;
  ipfsUri: string;
}

function App() {
  // =========================================================
  // PAGE
  // =========================================================

  const [activePage, setActivePage] =
    useState<Page>("dashboard");

  // =========================================================
  // WALLET
  // =========================================================

  const [walletAddress, setWalletAddress] =
    useState("");

  const [walletError, setWalletError] =
    useState("");

  const [connecting, setConnecting] =
    useState(false);

  // =========================================================
  // CREDENTIALS
  // =========================================================

  const [credential, setCredential] =
    useState<Credential | null>(null);

  const [credentials, setCredentials] =
    useState<Credential[]>([]);

  const [credentialsLoading, setCredentialsLoading] =
    useState(false);

  const [credentialError, setCredentialError] =
    useState("");

  // =========================================================
  // VERSION HISTORY
  // =========================================================

  const [versionHistory, setVersionHistory] =
    useState<Credential[]>([]);

  const [versionHistoryLoading, setVersionHistoryLoading] =
    useState(false);

  const [versionHistoryError, setVersionHistoryError] =
    useState("");

  // =========================================================
  // VERIFICATION
  // =========================================================

  const [verificationId, setVerificationId] =
    useState("1");

  const [verificationLoading, setVerificationLoading] =
    useState(false);

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  const [verificationError, setVerificationError] =
    useState("");

  // =========================================================
  // ISSUE CREDENTIAL
  // =========================================================

  const [studentDID, setStudentDID] =
    useState("");

  const [credentialType, setCredentialType] =
    useState("B.Tech");

  const [degree, setDegree] =
    useState("Bachelor of Technology");

  const [issueDate, setIssueDate] =
    useState("2026-08-21");

  const [issueLoading, setIssueLoading] =
    useState(false);

  const [issueError, setIssueError] =
    useState("");

  const [issueSuccess, setIssueSuccess] =
    useState<IssueSuccess | null>(null);

  // =========================================================
  // UPDATE CREDENTIAL
  // =========================================================

  const [updateCredentialId, setUpdateCredentialId] =
    useState<number | null>(null);

  const [updateStudentDID, setUpdateStudentDID] =
    useState("");

  const [updateCredentialType, setUpdateCredentialType] =
    useState("");

  const [updateInstitution, setUpdateInstitution] =
    useState("");

  const [updateInstitutionId, setUpdateInstitutionId] =
    useState("");

  const [updateDegree, setUpdateDegree] =
    useState("");

  const [updateIssueDate, setUpdateIssueDate] =
    useState("");

  const [updateLoading, setUpdateLoading] =
    useState(false);

  const [updateError, setUpdateError] =
    useState("");

  const [updateSuccess, setUpdateSuccess] =
    useState<UpdateSuccess | null>(null);

  // =========================================================
  // HELPERS
  // =========================================================

  const shortAddress = (value: string) => {
    if (!value) return "";

    return `${value.slice(0, 6)}...${value.slice(-4)}`;
  };

  const shortHash = (value: string) => {
    if (!value) return "N/A";

    if (value.length <= 22) {
      return value;
    }

    return `${value.slice(0, 10)}...${value.slice(-8)}`;
  };

  const getStatusText = (
    item: Credential
  ) => {
    if (item.active) {
      return "ACTIVE";
    }

    if (item.status === 2) {
      return "SUPERSEDED";
    }

    if (item.status === 3) {
      return "REVOKED";
    }

    return "UNKNOWN";
  };

  // =========================================================
  // LOAD ALL CREDENTIALS
  // =========================================================

  const loadAllCredentials =
    async () => {
      try {
        setCredentialsLoading(true);
        setCredentialError("");

        const data =
          await getAllCredentials();

        setCredentials(data);

        if (data.length > 0) {
          setCredential(
            data[data.length - 1]
          );
        }
      } catch (error) {
        console.error(
          "Failed to load credentials:",
          error
        );

        setCredentialError(
          error instanceof Error
            ? error.message
            : "Unable to discover credentials."
        );
      } finally {
        setCredentialsLoading(false);
      }
    };

  // =========================================================
  // LOAD VERSION HISTORY
  // =========================================================

  const loadVersionHistory =
    async (
      credentialId: number
    ) => {
      try {
        setVersionHistoryLoading(true);
        setVersionHistoryError("");

        const history =
          await getCredentialVersionHistory(
            credentialId
          );

        setVersionHistory(history);
      } catch (error) {
        console.error(
          "Version history loading failed:",
          error
        );

        setVersionHistoryError(
          error instanceof Error
            ? error.message
            : "Unable to load version history."
        );

        setVersionHistory([]);
      } finally {
        setVersionHistoryLoading(false);
      }
    };

  // =========================================================
  // OPEN CREDENTIAL DETAILS
  // =========================================================

  const openCredentialDetails =
    async (
      item: Credential
    ) => {
      setCredential(item);

      await loadVersionHistory(
        item.id
      );
    };

  // =========================================================
  // START UPDATE
  // =========================================================

  const startUpdateCredential =
    (item: Credential) => {
      if (!item.active) {
        setUpdateError(
          "Only an active credential can be updated."
        );

        return;
      }

      setUpdateCredentialId(
        item.id
      );

      setUpdateStudentDID(
        item.studentDID
      );

      setUpdateCredentialType(
        item.credentialType
      );

      setUpdateInstitution(
        item.institution
      );

      setUpdateInstitutionId(
        item.institutionId
      );

      setUpdateDegree(
        item.degree
      );

      setUpdateIssueDate(
        item.issueDate
      );

      setUpdateError("");

      setUpdateSuccess(null);

      setActivePage(
        "credentials"
      );

      window.setTimeout(() => {
        document
          .getElementById(
            "update-credential-section"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    };

  // =========================================================
  // CANCEL UPDATE
  // =========================================================

  const cancelUpdate =
    () => {
      setUpdateCredentialId(null);
      setUpdateStudentDID("");
      setUpdateCredentialType("");
      setUpdateInstitution("");
      setUpdateInstitutionId("");
      setUpdateDegree("");
      setUpdateIssueDate("");
      setUpdateError("");
      setUpdateSuccess(null);
    };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadAllCredentials();
  }, []);

  // =========================================================
  // CONNECT WALLET
  // =========================================================

  const handleConnectWallet =
    async () => {
      try {
        setConnecting(true);
        setWalletError("");

        const { address } =
          await connectWallet();

        setWalletAddress(address);

        await loadAllCredentials();
      } catch (error) {
        console.error(
          "Wallet connection failed:",
          error
        );

        setWalletError(
          error instanceof Error
            ? error.message
            : "Failed to connect wallet."
        );
      } finally {
        setConnecting(false);
      }
    };

  // =========================================================
  // ISSUE CREDENTIAL
  // =========================================================

  const handleIssueCredential =
    async () => {
      try {
        setIssueLoading(true);
        setIssueError("");
        setIssueSuccess(null);

        if (!walletAddress) {
          throw new Error(
            "Please connect the university wallet first."
          );
        }

        if (!studentDID.trim()) {
          throw new Error(
            "Student DID is required."
          );
        }

        if (!credentialType.trim()) {
          throw new Error(
            "Credential type is required."
          );
        }

        if (!degree.trim()) {
          throw new Error(
            "Degree is required."
          );
        }

        if (!issueDate) {
          throw new Error(
            "Issue date is required."
          );
        }

        const result =
          await issueCredential(
            studentDID.trim(),
            credentialType.trim(),
            degree.trim(),
            issueDate
          );

        setIssueSuccess({
          credentialId:
            result.credentialId,
          transactionHash:
            result.transactionHash,
          ipfsUri:
            result.ipfsUri,
        });

        await loadAllCredentials();

        if (
          result.credentialId
        ) {
          await loadVersionHistory(
            result.credentialId
          );
        }
      } catch (error) {
        console.error(
          "Credential issuance failed:",
          error
        );

        setIssueError(
          error instanceof Error
            ? error.message
            : "Credential issuance failed."
        );
      } finally {
        setIssueLoading(false);
      }
    };

  // =========================================================
  // UPDATE CREDENTIAL
  // =========================================================

  const handleUpdateCredential =
    async () => {
      try {
        setUpdateLoading(true);
        setUpdateError("");
        setUpdateSuccess(null);

        if (!walletAddress) {
          throw new Error(
            "Please connect the university wallet first."
          );
        }

        if (
          updateCredentialId === null
        ) {
          throw new Error(
            "No credential selected for update."
          );
        }

        if (!updateStudentDID.trim()) {
          throw new Error(
            "Student DID is required."
          );
        }

        if (!updateCredentialType.trim()) {
          throw new Error(
            "Credential type is required."
          );
        }

        if (!updateInstitution.trim()) {
          throw new Error(
            "Institution is required."
          );
        }

        if (!updateInstitutionId.trim()) {
          throw new Error(
            "Institution ID is required."
          );
        }

        if (!updateDegree.trim()) {
          throw new Error(
            "Degree is required."
          );
        }

        if (!updateIssueDate) {
          throw new Error(
            "Issue date is required."
          );
        }

        const result =
          await updateCredential(
            updateCredentialId,
            updateStudentDID.trim(),
            updateCredentialType.trim(),
            updateInstitution.trim(),
            updateInstitutionId.trim(),
            updateDegree.trim(),
            updateIssueDate
          );

        setUpdateSuccess({
          previousCredentialId:
            result.previousCredentialId,

          credentialId:
            result.credentialId,

          version:
            result.version,

          transactionHash:
            result.transactionHash,

          ipfsUri:
            result.ipfsUri,
        });

        await loadAllCredentials();

        const newCredentialId =
          result.credentialId ??
          result.previousCredentialId;

        await loadVersionHistory(
          newCredentialId
        );

        const updatedCredentials =
          await getAllCredentials();

        const updatedCredential =
          updatedCredentials.find(
            (item) =>
              item.id ===
              newCredentialId
          );

        if (updatedCredential) {
          setCredential(
            updatedCredential
          );
        }
      } catch (error) {
        console.error(
          "Credential update failed:",
          error
        );

        setUpdateError(
          error instanceof Error
            ? error.message
            : "Credential update failed."
        );
      } finally {
        setUpdateLoading(false);
      }
    };

  // =========================================================
  // VERIFY CREDENTIAL
  // =========================================================

  const handleVerifyCredential =
    async () => {
      try {
        setVerificationLoading(true);
        setVerificationError("");
        setVerificationResult(null);

        const id =
          Number(
            verificationId
          );

        if (
          !Number.isInteger(id) ||
          id <= 0
        ) {
          throw new Error(
            "Please enter a valid credential ID."
          );
        }

        const result =
          await verifyCredential(id);

        setVerificationResult(
          result
        );
      } catch (error) {
        console.error(
          "Credential verification failed:",
          error
        );

        setVerificationError(
          error instanceof Error
            ? error.message
            : "Credential verification failed."
        );
      } finally {
        setVerificationLoading(false);
      }
    };

  // =========================================================
  // DERIVED DATA
  // =========================================================

  const activeCredentials =
    credentials.filter(
      (item) => item.active
    );

  const totalIssued =
    credentials.length;

  const latestCredential =
    credentials.length > 0
      ? credentials[
          credentials.length - 1
        ]
      : null;

  const credentialIsActive =
    credential !== null &&
    credential.active;

  const updateTargetCredential =
    updateCredentialId !== null
      ? credentials.find(
          (item) =>
            item.id ===
            updateCredentialId
        )
      : null;

  // =========================================================
  // APP
  // =========================================================

  return (
    <div className="app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            E
          </div>

          <div>
            <h2>
              EduProof
            </h2>

            <span>
              Credential Network
            </span>
          </div>

        </div>

        <nav className="navigation">

          <button
            className={`nav-item ${
              activePage ===
              "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(
                "dashboard"
              )
            }
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage ===
              "credentials"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(
                "credentials"
              )
            }
          >
            <span>▣</span>
            Credentials
          </button>

          <button
            className={`nav-item ${
              activePage ===
              "issue"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(
                "issue"
              )
            }
          >
            <span>＋</span>
            Issue Credential
          </button>

          <button
            className={`nav-item ${
              activePage ===
              "verify"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(
                "verify"
              )
            }
          >
            <span>✓</span>
            Verify
          </button>

          <button
            className={`nav-item ${
              activePage ===
              "analytics"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setActivePage(
                "analytics"
              )
            }
          >
            <span>◫</span>
            Analytics
          </button>

        </nav>

        <div className="network-card">

          <div className="network-dot" />

          <div>

            <small>
              NETWORK
            </small>

            <strong>
              Ethereum Sepolia
            </strong>

          </div>

        </div>

        <div className="sidebar-footer">

          <span>
            EduProof v1.0
          </span>

          <span>
            Blockchain
          </span>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main-content">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="topbar">

          <div>

            <div className="eyebrow">
              DECENTRALIZED CREDENTIALS
            </div>

            <h1>

              {activePage ===
                "dashboard" &&
                "Dashboard"}

              {activePage ===
                "credentials" &&
                "Credentials"}

              {activePage ===
                "issue" &&
                "Issue Credential"}

              {activePage ===
                "verify" &&
                "Verify Credential"}

              {activePage ===
                "analytics" &&
                "Analytics"}

            </h1>

          </div>

          <div>

            <button
              className="connect-button"
              onClick={
                handleConnectWallet
              }
              disabled={
                connecting
              }
            >
              {connecting
                ? "Connecting..."
                : walletAddress
                  ? shortAddress(
                      walletAddress
                    )
                  : "Connect Wallet"}
            </button>

            {walletError && (

              <p
                style={{
                  color:
                    "#ff6b7a",
                  fontSize:
                    "11px",
                  margin:
                    "7px 0 0",
                  maxWidth:
                    "250px",
                  textAlign:
                    "right",
                }}
              >
                {walletError}
              </p>

            )}

          </div>

        </header>

        {/* ===================================================
            GLOBAL ERROR
        =================================================== */}

        {credentialError && (

          <div
            className="panel"
            style={{
              marginBottom:
                "18px",
              borderColor:
                "rgba(255, 107, 122, 0.25)",
            }}
          >

            <strong
              style={{
                color:
                  "#ff6b7a",
              }}
            >
              Blockchain data unavailable
            </strong>

            <p
              style={{
                color:
                  "#8a92ac",
                fontSize:
                  "12px",
                marginBottom:
                  "0",
              }}
            >
              {credentialError}
            </p>

          </div>

        )}

        {/* ===================================================
            DASHBOARD
        =================================================== */}

        {activePage ===
          "dashboard" && (

          <>

            <section className="hero">

              <div>

                <div className="hero-label">
                  TRUSTED ACADEMIC CREDENTIALS
                </div>

                <h2>

                  Credentials you can
                  <br />

                  <span>
                    actually verify.
                  </span>

                </h2>

                <p>
                  EduProof enables universities
                  to issue tamper-resistant
                  academic credentials using
                  blockchain, decentralized
                  identifiers, cryptographic
                  signatures and IPFS.
                </p>

                <div className="hero-buttons">

                  <button
                    className="primary-button"
                    onClick={() =>
                      setActivePage(
                        "issue"
                      )
                    }
                  >
                    Issue Credential
                    <span>
                      →
                    </span>
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      setActivePage(
                        "verify"
                      )
                    }
                  >
                    Verify Credential
                  </button>

                </div>

              </div>

              <div className="verification-visual">

                <div className="verification-ring">

                  <div className="verification-check">
                    ✓
                  </div>

                </div>

                <div className="verification-card">

                  <span>
                    VERIFICATION STATUS
                  </span>

                  <strong>

                    {credentialsLoading
                      ? "Checking..."
                      : credentialIsActive
                        ? "Credential Authentic"
                        : "Credential Status Unknown"}

                  </strong>

                  <small>
                    Blockchain + IPFS + ECDSA
                  </small>

                </div>

              </div>

            </section>

            <section className="stats-grid">

              <div className="stat-card">

                <span>
                  Total Credentials
                </span>

                <strong>
                  {credentialsLoading
                    ? "..."
                    : totalIssued}
                </strong>

                <small>
                  Discovered on-chain
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Active Credentials
                </span>

                <strong>
                  {credentialsLoading
                    ? "..."
                    : activeCredentials.length}
                </strong>

                <small className="success-text">
                  Current active records
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Latest Version
                </span>

                <strong>
                  {latestCredential
                    ? latestCredential.version
                    : "0"}
                </strong>

                <small>
                  Latest discovered credential
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Network
                </span>

                <strong>
                  Sepolia
                </strong>

                <small>
                  Ethereum testnet
                </small>

              </div>

            </section>

            <section className="content-grid">

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <div className="panel-label">
                      ON-CHAIN ACTIVITY
                    </div>

                    <h3>
                      Credential Activity
                    </h3>

                  </div>

                  <button
                    className="text-button"
                    onClick={() =>
                      setActivePage(
                        "credentials"
                      )
                    }
                  >
                    View details →
                  </button>

                </div>

                {credentialsLoading ? (

                  <div className="activity-row">

                    <div className="activity-info">

                      <strong>
                        Reading blockchain...
                      </strong>

                      <span>
                        Discovering credentials
                      </span>

                    </div>

                  </div>

                ) : credentials.length > 0 ? (

                  credentials
                    .slice()
                    .reverse()
                    .slice(0, 3)
                    .map(
                      (
                        item
                      ) => (

                        <div
                          className="activity-row"
                          key={item.id}
                        >

                          <div className="activity-icon">
                            ✓
                          </div>

                          <div className="activity-info">

                            <strong>
                              Credential #
                              {item.id}
                              {" "}issued
                            </strong>

                            <span>
                              {item.credentialType}
                              {" · "}
                              {item.institution}
                              {" · "}
                              Version{" "}
                              {item.version}
                            </span>

                          </div>

                          <div className="status-badge">
                            {getStatusText(
                              item
                            )}
                          </div>

                        </div>

                      )
                    )

                ) : (

                  <div className="activity-row">

                    <div className="activity-info">

                      <strong>
                        No credentials found
                      </strong>

                      <span>
                        No CredentialIssued
                        events were discovered.
                      </span>

                    </div>

                  </div>

                )}

              </div>

              <div className="panel">

                <div className="panel-header">

                  <div>

                    <div className="panel-label">
                      SECURITY
                    </div>

                    <h3>
                      Verification Layers
                    </h3>

                  </div>

                </div>

                <div className="security-list">

                  <div>
                    <span>✓</span>
                    <p>Blockchain record</p>
                    <strong>
                      {credentials.length >
                      0
                        ? "PASS"
                        : "WAIT"}
                    </strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>IPFS metadata</p>
                    <strong>
                      {latestCredential?.ipfsUri
                        ? "LINKED"
                        : "WAIT"}
                    </strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>Hash integrity</p>
                    <strong>
                      {latestCredential?.credentialHash
                        ? "READY"
                        : "WAIT"}
                    </strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>ECDSA signature</p>
                    <strong>
                      {latestCredential?.signature
                        ? "READY"
                        : "WAIT"}
                    </strong>
                  </div>

                  <div>
                    <span>✓</span>
                    <p>Credential status</p>
                    <strong>
                      {latestCredential?.active
                        ? "ACTIVE"
                        : "UNKNOWN"}
                    </strong>
                  </div>

                </div>

              </div>

            </section>

          </>
        )}

        {/* ===================================================
            CREDENTIALS
        =================================================== */}

        {activePage ===
          "credentials" && (

          <section className="page-section">

            {credential ? (

              <div
                className="panel"
                style={{
                  marginBottom:
                    "22px",
                }}
              >

                <div className="panel-header">

                  <div>

                    <div className="panel-label">
                      CREDENTIAL DETAILS
                    </div>

                    <h3>
                      Credential #
                      {credential.id}
                    </h3>

                  </div>

                  <div className="status-badge large">
                    {getStatusText(
                      credential
                    )}
                  </div>

                </div>

                <div className="credential-details">

                  <div>
                    <span>Degree</span>
                    <strong>
                      {credential.degree}
                    </strong>
                  </div>

                  <div>
                    <span>Credential Type</span>
                    <strong>
                      {
                        credential.credentialType
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Institution</span>
                    <strong>
                      {
                        credential.institution
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Issue Date</span>
                    <strong>
                      {
                        credential.issueDate
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Version</span>
                    <strong>
                      {
                        credential.version
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Student DID</span>
                    <strong>
                      {shortHash(
                        credential.studentDID
                      )}
                    </strong>
                  </div>

                </div>

                <div
                  className="contract-address"
                  style={{
                    marginTop:
                      "18px",
                  }}
                >

                  <span>
                    CREDENTIAL HASH
                  </span>

                  <code>
                    {
                      credential.credentialHash
                    }
                  </code>

                </div>

                <div
                  className="hero-buttons"
                  style={{
                    marginTop:
                      "18px",
                  }}
                >

                  <button
                    className="primary-button"
                    onClick={() => {

                      setVerificationId(
                        String(
                          credential.id
                        )
                      );

                      setVerificationResult(
                        null
                      );

                      setVerificationError(
                        ""
                      );

                      setActivePage(
                        "verify"
                      );
                    }}
                  >
                    Verify Credential →
                  </button>

                  {credential.active && (

                    <button
                      className="secondary-button"
                      onClick={() =>
                        startUpdateCredential(
                          credential
                        )
                      }
                    >
                      Update Credential
                    </button>

                  )}

                </div>

                {/* =================================================
                    UPDATE CREDENTIAL
                ================================================= */}

                {updateCredentialId !==
                  null && (

                  <div
                    id="update-credential-section"
                    className="panel"
                    style={{
                      marginTop:
                        "28px",
                      borderColor:
                        "rgba(120, 150, 255, 0.25)",
                      background:
                        "rgba(120, 150, 255, 0.035)",
                    }}
                  >

                    <div className="panel-label">
                      VERSION UPDATE
                    </div>

                    <h3
                      style={{
                        marginTop:
                          "6px",
                      }}
                    >
                      Create Version{" "}
                      {(
                        updateTargetCredential
                          ?.version ?? 0
                      ) + 1}
                    </h3>

                    <p
                      style={{
                        color:
                          "#8a92ac",
                        fontSize:
                          "12px",
                        lineHeight:
                          1.6,
                      }}
                    >
                      Updating this credential
                      will preserve the previous
                      blockchain record and create
                      a new version. The previous
                      version will become
                      <strong>
                        {" "}SUPERSEDED
                      </strong>
                      .
                    </p>

                    {updateError && (

                      <div
                        className="panel"
                        style={{
                          marginTop:
                            "16px",
                          borderColor:
                            "rgba(255, 107, 122, 0.35)",
                        }}
                      >

                        <strong
                          style={{
                            color:
                              "#ff6b7a",
                          }}
                        >
                          Update Failed
                        </strong>

                        <p
                          style={{
                            color:
                              "#8a92ac",
                            fontSize:
                              "12px",
                            marginBottom:
                              "0",
                          }}
                        >
                          {
                            updateError
                          }
                        </p>

                      </div>

                    )}

                    {updateSuccess && (

                      <div
                        className="panel"
                        style={{
                          marginTop:
                            "16px",
                          borderColor:
                            "rgba(76, 220, 150, 0.3)",
                        }}
                      >

                        <strong
                          style={{
                            color:
                              "#4cdc96",
                          }}
                        >
                          ✓ Version{" "}
                          {
                            updateSuccess.version
                          }{" "}
                          Created Successfully
                        </strong>

                        <p
                          style={{
                            color:
                              "#8a92ac",
                            fontSize:
                              "12px",
                          }}
                        >
                          Credential #
                          {
                            updateSuccess.previousCredentialId
                          }{" "}
                          was updated and a new
                          credential version was
                          created on Sepolia.
                        </p>

                        <div className="contract-address">

                          <span>
                            NEW CREDENTIAL ID
                          </span>

                          <code>
                            {
                              updateSuccess.credentialId ??
                              "Check transaction"
                            }
                          </code>

                        </div>

                        <div className="contract-address">

                          <span>
                            TRANSACTION
                          </span>

                          <code>
                            {
                              updateSuccess.transactionHash
                          }
                        </code>

                        </div>

                        <div className="contract-address">

                          <span>
                            IPFS URI
                          </span>

                          <code>
                            {
                              updateSuccess.ipfsUri
                            }
                          </code>

                        </div>

                      </div>

                    )}

                    <div
                      className="form-grid"
                      style={{
                        marginTop:
                          "18px",
                      }}
                    >

                      <label>

                        Student DID

                        <input
                          type="text"
                          value={
                            updateStudentDID
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateStudentDID(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label>

                        Credential Type

                        <input
                          type="text"
                          value={
                            updateCredentialType
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateCredentialType(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label>

                        Institution

                        <input
                          type="text"
                          value={
                            updateInstitution
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateInstitution(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label>

                        Institution ID

                        <input
                          type="text"
                          value={
                            updateInstitutionId
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateInstitutionId(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label className="full-width">

                        Degree

                        <input
                          type="text"
                          value={
                            updateDegree
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateDegree(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label>

                        Issue Date

                        <input
                          type="date"
                          value={
                            updateIssueDate
                          }
                          onChange={(
                            event
                          ) =>
                            setUpdateIssueDate(
                              event.target.value
                            )
                          }
                          disabled={
                            updateLoading
                          }
                        />

                      </label>

                      <label>

                        New Version

                        <input
                          type="number"
                          value={
                            (
                              updateTargetCredential
                                ?.version ?? 0
                            ) + 1
                          }
                          readOnly
                        />

                      </label>

                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        alignItems:
                          "center",
                        gap:
                          "16px",
                        marginTop:
                          "20px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <div>

                        <span
                          style={{
                            display:
                              "block",
                            color:
                              "#6f7895",
                            fontSize:
                              "10px",
                            letterSpacing:
                              "1.4px",
                            fontWeight:
                              700,
                          }}
                        >
                          UPDATE FLOW
                        </span>

                        <small
                          style={{
                            display:
                              "block",
                            color:
                              "#8a92ac",
                            fontSize:
                              "11px",
                            marginTop:
                              "5px",
                          }}
                        >
                          Hash → ECDSA → IPFS →
                          Blockchain
                        </small>

                      </div>

                      <div
                        className="hero-buttons"
                        style={{
                          marginTop:
                            "0",
                        }}
                      >

                        <button
                          className="secondary-button"
                          onClick={
                            cancelUpdate
                          }
                          disabled={
                            updateLoading
                          }
                        >
                          Cancel
                        </button>

                        <button
                          className="primary-button"
                          onClick={
                            handleUpdateCredential
                          }
                          disabled={
                            updateLoading ||
                            !walletAddress
                          }
                        >
                          {updateLoading
                            ? "Updating..."
                            : "Create New Version →"}
                        </button>

                      </div>

                    </div>

                    {updateLoading && (

                      <div
                        style={{
                          marginTop:
                            "18px",
                          padding:
                            "14px",
                          borderRadius:
                            "10px",
                          background:
                            "rgba(255,255,255,0.025)",
                          border:
                            "1px solid rgba(255,255,255,0.06)",
                        }}
                      >

                        <p
                          style={{
                            margin:
                              "0",
                            color:
                              "#8a92ac",
                            fontSize:
                              "12px",
                            lineHeight:
                              1.6,
                          }}
                        >
                          Creating new credential
                          hash → signing with the
                          university wallet → uploading
                          the new Verifiable Credential
                          to IPFS → waiting for the
                          Sepolia transaction.
                        </p>

                      </div>

                    )}

                  </div>

                )}

                {/* VERSION HISTORY */}

                <div
                  style={{
                    marginTop:
                      "28px",
                  }}
                >

                  <div className="panel-label">
                    VERSION HISTORY
                  </div>

                  <h3
                    style={{
                      marginTop:
                        "6px",
                    }}
                  >
                    Credential Versions
                  </h3>

                  {versionHistoryLoading ? (

                    <div
                      className="activity-row"
                      style={{
                        marginTop:
                          "12px",
                      }}
                    >

                      <div className="activity-info">

                        <strong>
                          Loading version history...
                        </strong>

                        <span>
                          Reading version records
                          from Ethereum Sepolia.
                        </span>

                      </div>

                    </div>

                  ) : versionHistoryError ? (

                    <div
                      className="panel"
                      style={{
                        marginTop:
                          "12px",
                        borderColor:
                          "rgba(255, 107, 122, 0.3)",
                      }}
                    >

                      <strong
                        style={{
                          color:
                            "#ff6b7a",
                        }}
                      >
                        Version history unavailable
                      </strong>

                      <p
                        style={{
                          color:
                            "#8a92ac",
                          fontSize:
                            "12px",
                          marginBottom:
                            "0",
                        }}
                      >
                        {
                          versionHistoryError
                        }
                      </p>

                    </div>

                  ) : versionHistory.length ===
                    0 ? (

                    <div
                      className="activity-row"
                      style={{
                        marginTop:
                          "12px",
                      }}
                    >

                      <div className="activity-info">

                        <strong>
                          No version history found
                        </strong>

                        <span>
                          This credential does not
                          have version records.
                        </span>

                      </div>

                    </div>

                  ) : (

                    <div
                      style={{
                        marginTop:
                          "14px",
                      }}
                    >

                      {versionHistory.map(
                        (
                          versionItem,
                          index
                        ) => (

                          <div
                            key={
                              versionItem.id
                            }
                            style={{
                              display:
                                "flex",
                              gap:
                                "14px",
                              padding:
                                "16px 0",
                              borderBottom:
                                index ===
                                versionHistory.length -
                                  1
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.06)",
                            }}
                          >

                            <div
                              style={{
                                width:
                                  "34px",
                                height:
                                  "34px",
                                minWidth:
                                  "34px",
                                borderRadius:
                                  "50%",
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  versionItem.active
                                    ? "rgba(76, 220, 150, 0.12)"
                                    : "rgba(255,255,255,0.05)",
                                border:
                                  versionItem.active
                                    ? "1px solid rgba(76, 220, 150, 0.25)"
                                    : "1px solid rgba(255,255,255,0.08)",
                                color:
                                  versionItem.active
                                    ? "#4cdc96"
                                    : "#8a92ac",
                                fontWeight:
                                  700,
                              }}
                            >
                              {versionItem.version}
                            </div>

                            <div
                              style={{
                                flex:
                                  1,
                              }}
                            >

                              <div
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap:
                                    "12px",
                                }}
                              >

                                <strong>
                                  Version{" "}
                                  {
                                    versionItem.version
                                  }
                                </strong>

                                <span className="status-badge">
                                  {
                                    getStatusText(
                                      versionItem
                                    )
                                  }
                                </span>

                              </div>

                              <p
                                style={{
                                  color:
                                    "#8a92ac",
                                  fontSize:
                                    "12px",
                                  margin:
                                    "6px 0",
                                }}
                              >
                                {
                                  versionItem.degree
                                }
                                {" · "}
                                {
                                  versionItem.institution
                                }
                                {" · "}
                                {
                                  versionItem.issueDate
                                }
                              </p>

                              <div
                                className="contract-address"
                                style={{
                                  marginTop:
                                    "8px",
                                }}
                              >

                                <span>
                                  HASH
                                </span>

                                <code>
                                  {
                                    versionItem.credentialHash
                                  }
                                </code>

                              </div>

                              <div
                                className="contract-address"
                                style={{
                                  marginTop:
                                    "6px",
                                }}
                              >

                                <span>
                                  IPFS
                                </span>

                                <code>
                                  {
                                    versionItem.ipfsUri
                                  }
                                </code>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

            ) : (

              <div className="page-intro">

                <div className="panel-label">
                  BLOCKCHAIN RECORDS
                </div>

                <h2>
                  Credentials
                </h2>

                <p>
                  Select a credential below
                  to view its complete details
                  and version history.
                </p>

              </div>

            )}

            {/* CREDENTIAL LIST */}

            {credentialsLoading ? (

              <div className="credential-card">

                <h3>
                  Loading credentials...
                </h3>

                <p>
                  Discovering credential events
                  from Ethereum Sepolia.
                </p>

              </div>

            ) : credentials.length ===
              0 ? (

              <div className="credential-card">

                <h3>
                  No credentials found
                </h3>

                <p>
                  No CredentialIssued events
                  were found on the deployed
                  EduProof contract.
                </p>

              </div>

            ) : (

              <div
                className="credentials-list"
                style={{
                  display:
                    "grid",
                  gap:
                    "18px",
                }}
              >

                {credentials.map(
                  (
                    item
                  ) => (

                    <div
                      className="credential-card"
                      key={item.id}
                    >

                      <div className="credential-header">

                        <div className="credential-symbol">
                          E
                        </div>

                        <div>

                          <div className="panel-label">
                            CREDENTIAL #
                            {item.id}
                          </div>

                          <h3>
                            {item.degree}
                          </h3>

                          <p>
                            {
                              item.institution
                            }
                            {" · "}
                            {
                              item.credentialType
                            }
                          </p>

                        </div>

                        <div className="status-badge large">
                          {
                            getStatusText(
                              item
                            )
                          }
                        </div>

                      </div>

                      <div className="credential-details">

                        <div>

                          <span>
                            Student DID
                          </span>

                          <strong>
                            {shortHash(
                              item.studentDID
                            )}
                          </strong>

                        </div>

                        <div>

                          <span>
                            Issue Date
                          </span>

                          <strong>
                            {
                              item.issueDate
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Version
                          </span>

                          <strong>
                            {
                              item.version
                            }
                          </strong>

                        </div>

                        <div>

                          <span>
                            Institution ID
                          </span>

                          <strong>
                            {
                              item.institutionId
                            }
                          </strong>

                        </div>

                      </div>

                      <div className="contract-address">

                        <span>
                          CREDENTIAL HASH
                        </span>

                        <code>
                          {shortHash(
                            item.credentialHash
                          )}
                        </code>

                      </div>

                      <div className="hero-buttons">

                        <button
                          className="primary-button"
                          onClick={() => {

                            setCredential(
                              item
                            );

                            setVerificationId(
                              String(
                                item.id
                              )
                            );

                            setVerificationResult(
                              null
                            );

                            setVerificationError(
                              ""
                            );

                            setActivePage(
                              "verify"
                            );

                          }}
                        >
                          Verify →
                        </button>

                        <button
                          className="secondary-button"
                          onClick={() =>
                            openCredentialDetails(
                              item
                            )
                          }
                        >
                          View Details
                        </button>

                        {item.active && (

                          <button
                            className="secondary-button"
                            onClick={() =>
                              startUpdateCredential(
                                item
                              )
                            }
                          >
                            Update
                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        )}

        {/* ===================================================
            ISSUE CREDENTIAL
        =================================================== */}

        {activePage ===
          "issue" && (

          <section className="page-section">

            <div className="page-intro">

              <div className="panel-label">
                UNIVERSITY ISSUER
              </div>

              <h2>
                Issue a Credential
              </h2>

              <p>
                Create a verifiable academic
                credential secured by blockchain,
                cryptographic signatures and IPFS.
              </p>

            </div>

            <div className="form-panel">

              {issueError && (

                <div
                  className="panel"
                  style={{
                    marginBottom:
                      "20px",
                    borderColor:
                      "rgba(255, 107, 122, 0.35)",
                  }}
                >

                  <strong
                    style={{
                      color:
                        "#ff6b7a",
                    }}
                  >
                    Issuance Failed
                  </strong>

                  <p
                    style={{
                      color:
                        "#8a92ac",
                      fontSize:
                        "12px",
                      marginBottom:
                        "0",
                    }}
                  >
                    {issueError}
                  </p>

                </div>

              )}

              {issueSuccess && (

                <div
                  className="panel"
                  style={{
                    marginBottom:
                      "20px",
                    borderColor:
                      "rgba(76, 220, 150, 0.30)",
                  }}
                >

                  <strong
                    style={{
                      color:
                        "#4cdc96",
                    }}
                  >
                    ✓ Credential Issued Successfully
                  </strong>

                  <p
                    style={{
                      color:
                        "#8a92ac",
                      fontSize:
                        "12px",
                    }}
                  >
                    Your credential has been
                    recorded on Ethereum Sepolia.
                  </p>

                  <div className="contract-address">

                    <span>
                      CREDENTIAL ID
                    </span>

                    <code>
                      {
                        issueSuccess.credentialId ??
                        "Check transaction"
                      }
                    </code>

                  </div>

                  <div className="contract-address">

                    <span>
                      TRANSACTION
                    </span>

                    <code>
                      {
                        issueSuccess.transactionHash
                      }
                    </code>

                  </div>

                  <div className="contract-address">

                    <span>
                      IPFS URI
                    </span>

                    <code>
                      {
                        issueSuccess.ipfsUri
                      }
                    </code>

                  </div>

                  <div
                    className="hero-buttons"
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >

                    <button
                      className="primary-button"
                      onClick={() =>
                        setActivePage(
                          "credentials"
                        )
                      }
                    >
                      View Credentials →
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        setActivePage(
                          "verify"
                        )
                      }
                    >
                      Verify Credential
                    </button>

                  </div>

                </div>

              )}

              <div className="form-grid">

                <label>

                  Student DID

                  <input
                    type="text"
                    value={
                      studentDID
                    }
                    onChange={(event) =>
                      setStudentDID(
                        event.target.value
                      )
                    }
                    placeholder="did:eduproof:student..."
                    disabled={
                      issueLoading
                    }
                  />

                  <small
                    style={{
                      color:
                        "#6f7895",
                      fontSize:
                        "11px",
                    }}
                  >
                    Example:
                    did:eduproof:8a3552...
                  </small>

                </label>

                <label>

                  Credential Type

                  <input
                    type="text"
                    value={
                      credentialType
                    }
                    onChange={(event) =>
                      setCredentialType(
                        event.target.value
                      )
                    }
                    placeholder="B.Tech"
                    disabled={
                      issueLoading
                    }
                  />

                </label>

                <label className="full-width">

                  Degree

                  <input
                    type="text"
                    value={
                      degree
                    }
                    onChange={(event) =>
                      setDegree(
                        event.target.value
                      )
                    }
                    placeholder="Bachelor of Technology"
                    disabled={
                      issueLoading
                    }
                  />

                </label>

                <label>

                  Issue Date

                  <input
                    type="date"
                    value={
                      issueDate
                    }
                    onChange={(event) =>
                      setIssueDate(
                        event.target.value
                      )
                    }
                    disabled={
                      issueLoading
                    }
                  />

                </label>

                <label>

                  Version

                  <input
                    type="number"
                    value="1"
                    readOnly
                  />

                </label>

              </div>

              <div
                className="panel"
                style={{
                  marginTop:
                    "20px",
                }}
              >

                <div className="panel-label">
                  ISSUER
                </div>

                <h3>
                  Connected University
                </h3>

                {walletAddress ? (

                  <div className="contract-address">

                    <span>
                      WALLET
                    </span>

                    <code>
                      {
                        walletAddress
                      }
                    </code>

                  </div>

                ) : (

                  <p
                    style={{
                      color:
                        "#8a92ac",
                      fontSize:
                        "12px",
                      marginBottom:
                        "0",
                    }}
                  >
                    Connect the university
                    wallet before issuing
                    a credential.
                  </p>

                )}

              </div>

              <div className="form-footer">

                <div>

                  <span>
                    STORAGE
                  </span>

                  <strong>
                    IPFS + Blockchain
                  </strong>

                  <small
                    style={{
                      display:
                        "block",
                      color:
                        "#6f7895",
                      marginTop:
                        "4px",
                    }}
                  >
                    ECDSA signed credential
                  </small>

                </div>

                <button
                  className="primary-button"
                  onClick={
                    handleIssueCredential
                  }
                  disabled={
                    issueLoading ||
                    !walletAddress
                  }
                >
                  {issueLoading
                    ? "Issuing..."
                    : "Issue Credential →"}
                </button>

              </div>

              {issueLoading && (

                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "16px",
                    borderRadius:
                      "12px",
                    background:
                      "rgba(255,255,255,0.025)",
                    border:
                      "1px solid rgba(255,255,255,0.06)",
                  }}
                >

                  <p
                    style={{
                      margin:
                        "0",
                      color:
                        "#8a92ac",
                      fontSize:
                        "12px",
                    }}
                  >
                    Creating credential hash →
                    signing with university wallet →
                    uploading VC to IPFS →
                    sending transaction to Sepolia.
                  </p>

                </div>

              )}

            </div>

          </section>

        )}

        {/* ===================================================
            VERIFY
        =================================================== */}

        {activePage ===
          "verify" && (

          <section className="verify-page">

            <div className="verify-header">

              <div className="panel-label">
                PUBLIC VERIFICATION
              </div>

              <h2>
                Verify a Credential
              </h2>

              <p>
                Confirm whether an academic
                credential was genuinely issued
                and has not been tampered with.
              </p>

            </div>

            <div className="verify-box">

              {!verificationResult && (
                <div className="verify-icon">
                  ✓
                </div>
              )}

              <h3>
                Enter Credential ID
              </h3>

              <p>
                Enter a credential ID to verify
                its blockchain record, IPFS
                metadata, cryptographic hash
                and issuer signature.
              </p>

              <div className="verify-input">

                <input
                  type="number"
                  min="1"
                  value={
                    verificationId
                  }
                  onChange={(event) =>
                    setVerificationId(
                      event.target.value
                    )
                  }
                  placeholder="Credential ID e.g. 1"
                />

                <button
                  className="primary-button"
                  onClick={
                    handleVerifyCredential
                  }
                  disabled={
                    verificationLoading
                  }
                >
                  {verificationLoading
                    ? "Verifying..."
                    : "Verify"}
                </button>

              </div>

              {verificationError && (

                <div
                  className="panel"
                  style={{
                    marginTop:
                      "20px",
                    borderColor:
                      "rgba(255, 107, 122, 0.35)",
                  }}
                >

                  <strong
                    style={{
                      color:
                        "#ff6b7a",
                    }}
                  >
                    Verification Failed
                  </strong>

                  <p
                    style={{
                      color:
                        "#8a92ac",
                      fontSize:
                        "12px",
                      marginBottom:
                        "0",
                    }}
                  >
                    {
                      verificationError
                    }
                  </p>

                </div>

              )}

              {verificationResult && (

                <div
                  style={{
                    marginTop:
                      "28px",
                    textAlign:
                      "left",
                  }}
                >

                  <div
                    style={{
                      padding:
                        "22px",
                      border:
                        `1px solid ${
                          verificationResult.verified
                            ? "rgba(76, 220, 150, 0.30)"
                            : "rgba(255, 107, 122, 0.30)"
                        }`,
                      borderRadius:
                        "16px",
                      background:
                        verificationResult.verified
                          ? "rgba(76, 220, 150, 0.05)"
                          : "rgba(255, 107, 122, 0.05)",
                      marginBottom:
                        "18px",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "32px",
                        marginBottom:
                          "8px",
                      }}
                    >
                      {
                        verificationResult.verified
                          ? "✓"
                          : "✕"
                      }
                    </div>

                    <h3
                      style={{
                        margin:
                          "0 0 6px",
                        color:
                          verificationResult.verified
                            ? "#4cdc96"
                            : "#ff6b7a",
                      }}
                    >
                      {
                        verificationResult.verified
                          ? "CREDENTIAL VERIFIED"
                          : "CREDENTIAL VERIFICATION FAILED"
                      }
                    </h3>

                    <p
                      style={{
                        margin:
                          "0",
                        color:
                          "#8a92ac",
                        fontSize:
                          "12px",
                      }}
                    >
                      {
                        verificationResult.verified
                          ? "This credential passed all available verification checks."
                          : "One or more verification checks failed."
                      }
                    </p>

                  </div>

                  <div className="credential-details">

                    <div>
                      <span>Credential</span>
                      <strong>
                        #
                        {
                          verificationResult
                            .credential
                            .id
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Degree</span>
                      <strong>
                        {
                          verificationResult
                            .credential
                            .degree
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Institution</span>
                      <strong>
                        {
                          verificationResult
                            .credential
                            .institution
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Issue Date</span>
                      <strong>
                        {
                          verificationResult
                            .credential
                            .issueDate
                        }
                      </strong>
                    </div>

                  </div>

                  <div
                    className="panel"
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >

                    <div className="panel-header">

                      <div>

                        <div className="panel-label">
                          VERIFICATION ENGINE
                        </div>

                        <h3>
                          Security Checks
                        </h3>

                      </div>

                    </div>

                    <div className="security-list">

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .hashMatches
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>Hash integrity</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .hashMatches
                              ? "MATCH"
                              : "FAILED"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .signatureValid
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>ECDSA signature</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .signatureValid
                              ? "VALID"
                              : "FAILED"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .issuerAuthorized
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>Issuer authorization</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .issuerAuthorized
                              ? "AUTHORIZED"
                              : "FAILED"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .credentialActive
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>Credential status</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .credentialActive
                              ? "ACTIVE"
                              : "REVOKED"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .studentDIDMatches
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>Student DID</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .studentDIDMatches
                              ? "MATCH"
                              : "FAILED"
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            verificationResult
                              .checks
                              .issuerDIDPresent
                              ? "✓"
                              : "✕"
                          }
                        </span>
                        <p>Issuer DID</p>
                        <strong>
                          {
                            verificationResult
                              .checks
                              .issuerDIDPresent
                              ? "PRESENT"
                              : "MISSING"
                          }
                        </strong>
                      </div>

                    </div>

                  </div>

                  <div
                    className="panel"
                    style={{
                      marginTop:
                        "18px",
                    }}
                  >

                    <div className="panel-label">
                      BLOCKCHAIN PROOF
                    </div>

                    <h3>
                      Cryptographic Evidence
                    </h3>

                    <div className="contract-address">

                      <span>
                        STUDENT DID
                      </span>

                      <code>
                        {
                          verificationResult
                            .credential
                            .studentDID
                        }
                      </code>

                    </div>

                    <div className="contract-address">

                      <span>
                        CREDENTIAL HASH
                      </span>

                      <code>
                        {
                          verificationResult
                            .credential
                            .credentialHash
                        }
                      </code>

                    </div>

                    <div className="contract-address">

                      <span>
                        IPFS URI
                      </span>

                      <code>
                        {
                          verificationResult
                            .credential
                            .ipfsUri
                        }
                      </code>

                    </div>

                  </div>

                </div>

              )}

              {!verificationResult && (

                <div className="verification-methods">

                  <span>✓ Blockchain</span>
                  <span>✓ IPFS</span>
                  <span>✓ Hash</span>
                  <span>✓ ECDSA</span>
                  <span>✓ Issuer</span>

                </div>

              )}

            </div>

          </section>

        )}

        {/* ===================================================
            ANALYTICS
        =================================================== */}

        {activePage ===
          "analytics" && (

          <section className="page-section">

            <div className="page-intro">

              <div className="panel-label">
                NETWORK INSIGHTS
              </div>

              <h2>
                Analytics
              </h2>

              <p>
                Current information discovered
                from the EduProof blockchain
                deployment.
              </p>

            </div>

            <div className="stats-grid">

              <div className="stat-card">

                <span>
                  Total Credentials
                </span>

                <strong>
                  {totalIssued}
                </strong>

                <small>
                  Discovered on-chain
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Active Credentials
                </span>

                <strong>
                  {
                    activeCredentials.length
                  }
                </strong>

                <small>
                  Currently active
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Latest Version
                </span>

                <strong>
                  {
                    latestCredential
                      ? latestCredential.version
                      : "0"
                  }
                </strong>

                <small>
                  Latest discovered record
                </small>

              </div>

              <div className="stat-card">

                <span>
                  Network
                </span>

                <strong>
                  Sepolia
                </strong>

                <small>
                  Chain ID 11155111
                </small>

              </div>

            </div>

            <div className="panel analytics-panel">

              <div className="panel-header">

                <div>

                  <div className="panel-label">
                    EDUPROOF CONTRACT
                  </div>

                  <h3>
                    Ethereum Sepolia
                  </h3>

                </div>

                <div className="status-badge">
                  CONNECTED
                </div>

              </div>

              <div className="contract-address">

                <span>
                  CONTRACT ADDRESS
                </span>

                <code>
                  0x75f4c5489E34CC1d1c67E3c302dDD76a86956e8a
                </code>

              </div>

              {latestCredential && (
                <>

                  <div className="contract-address">

                    <span>
                      LATEST CREDENTIAL
                    </span>

                    <code>
                      #
                      {
                        latestCredential.id
                      }
                    </code>

                  </div>

                  <div className="contract-address">

                    <span>
                      CREDENTIAL HASH
                    </span>

                    <code>
                      {
                        latestCredential
                          .credentialHash
                      }
                    </code>

                  </div>

                  <div className="contract-address">

                    <span>
                      IPFS URI
                    </span>

                    <code>
                      {
                        latestCredential
                          .ipfsUri
                      }
                    </code>

                  </div>

                </>
              )}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default App;