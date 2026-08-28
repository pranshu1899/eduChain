import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import StudentLayout from "./StudentLayout";

import {
  getReadOnlyContract,
} from "../../services/eduProof";

import {
  createStudentDID,
} from "../../utils/didUtils";

interface LocalEthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on?(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;

  removeListener?(
    event: string,
    handler: (...args: unknown[]) => void,
  ): void;
}

interface Credential {
  id: number;
  studentDID: string;
  credentialType: string;
  institution: string;
  degree: string;
  issueDate: string;
  version: number;
  status: number;
}

function getEthereum():
  LocalEthereumProvider | null {
  return (
    window as Window & {
      ethereum?: LocalEthereumProvider;
    }
  ).ethereum ?? null;
}

function statusText(status: number) {
  if (status === 0) {
    return "ACTIVE";
  }

  if (status === 1) {
    return "REVOKED";
  }

  if (status === 2) {
    return "SUPERSEDED";
  }

  return "UNKNOWN";
}


function formatDate(date: string) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

export default function StudentDashboard() {

  const [
    walletAddress,
    setWalletAddress,
  ] = useState("");

  const [
    connected,
    setConnected,
  ] = useState(false);

  const [
    studentDID,
    setStudentDID,
  ] = useState("");

  const [
    credentials,
    setCredentials,
  ] = useState<Credential[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =====================================================
     LOAD STUDENT CREDENTIALS
     ===================================================== */

  const loadStudent =
    useCallback(
      async (address: string) => {
        try {
          setLoading(true);
          setError("");

          const did =
            createStudentDID(
              address,
            );

          setStudentDID(
            did,
          );

          const contract =
            getReadOnlyContract();

          /*
           * Current contract ABI does not expose
           * getCredentialsByStudent().
           *
           * Therefore we scan issued credentials
           * and match the student DID.
           */

          const total =
            Number(
              await contract.totalCredentialsIssued(),
            );

          const found: Credential[] =
            [];

          for (
            let id = 1;
            id <= total;
            id++
          ) {
            try {

              const result =
                await contract.getCredential(
                  id,
                );

              const credentialDID =
                String(
                  result.studentDID,
                );

              if (
                credentialDID !==
                did
              ) {
                continue;
              }

              found.push({
                id: Number(
                  result.id,
                ),

                studentDID:
                  credentialDID,

                credentialType:
                  String(
                    result.credentialType,
                  ),

                institution:
                  String(
                    result.institution,
                  ),

                degree:
                  String(
                    result.degree,
                  ),

                issueDate:
                  String(
                    result.issueDate,
                  ),

                version:
                  Number(
                    result.version,
                  ),

                status:
                  Number(
                    result.status,
                  ),
              });

            } catch (
              credentialError
            ) {
              console.warn(
                `Unable to read credential ${id}`,
                credentialError,
              );
            }
          }

          setCredentials(
            found,
          );

        } catch (
          studentError
        ) {

          console.error(
            "Student dashboard loading failed:",
            studentError,
          );

          setError(
            "Unable to load your credentials from the EduProof blockchain.",
          );

        } finally {
          setLoading(false);
        }
      },
      [],
    );

  /* =====================================================
     CONNECT WALLET
     ===================================================== */

  const connectWallet =
    useCallback(
      async () => {

        const ethereum =
          getEthereum();

        if (!ethereum) {

          setError(
            "MetaMask is not installed.",
          );

          return;
        }

        try {

          const accounts =
            (await ethereum.request({
              method:
                "eth_requestAccounts",
            })) as string[];

          if (
            accounts.length === 0
          ) {
            return;
          }

          const address =
            accounts[0];

          setWalletAddress(
            address,
          );

          setConnected(
            true,
          );

          await loadStudent(
            address,
          );

        } catch (
          walletError
        ) {

          console.error(
            "Wallet connection failed:",
            walletError,
          );

          setError(
            "Wallet connection was rejected.",
          );
        }
      },
      [loadStudent],
    );

  /* =====================================================
     DETECT CONNECTED WALLET
     ===================================================== */

  useEffect(() => {

    const ethereum =
      getEthereum();

    if (!ethereum) {

      setError(
        "MetaMask is not installed. Install MetaMask to continue.",
      );

      return;
    }

    const detectWallet =
      async () => {

        try {

          const accounts =
            (await ethereum.request({
              method:
                "eth_accounts",
            })) as string[];

          if (
            accounts.length === 0
          ) {

            setConnected(
              false,
            );

            return;
          }

          const address =
            accounts[0];

          setWalletAddress(
            address,
          );

          setConnected(
            true,
          );

          await loadStudent(
            address,
          );

        } catch (
          walletError
        ) {

          console.error(
            "Wallet detection failed:",
            walletError,
          );
        }
      };

    detectWallet();

    /* =================================================
       METAMASK ACCOUNT CHANGE
       ================================================= */

    const handleAccountsChanged =
      (...args: unknown[]) => {

        const accounts =
          args[0] as
            | string[]
            | undefined;

        if (
          !accounts ||
          accounts.length === 0
        ) {

          setWalletAddress(
            "",
          );

          setStudentDID(
            "",
          );

          setCredentials(
            [],
          );

          setConnected(
            false,
          );

          return;
        }

        const address =
          accounts[0];

        setWalletAddress(
          address,
        );

        setConnected(
          true,
        );

        void loadStudent(
          address,
        );
      };

    ethereum.on?.(
      "accountsChanged",
      handleAccountsChanged,
    );

    return () => {

      ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged,
      );

    };

  }, [loadStudent]);

  /* =====================================================
     STATISTICS
     ===================================================== */

  const activeCredentials =
    credentials.filter(
      (credential) =>
        credential.status === 0,
    );

  const revokedCredentials =
    credentials.filter(
      (credential) =>
        credential.status === 1,
    );

  const supersededCredentials =
    credentials.filter(
      (credential) =>
        credential.status === 2,
    );

  /* =====================================================
     PAGE
     ===================================================== */

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

      {/* =================================================
          HEADER
          ================================================= */}

      <section className="dashboard-page-header">

        <div>

          <span className="dashboard-eyebrow">
            STUDENT OVERVIEW
          </span>

          <h1>
            My Credentials
          </h1>

          <p>
            View your academic credentials and
            blockchain-backed proof of authenticity.
          </p>

        </div>

      </section>

      {/* =================================================
          IDENTITY & WALLET
          ================================================= */}

      <section className="dashboard-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", background: "linear-gradient(to right, rgba(52, 211, 153, 0.05), rgba(139, 92, 246, 0.05))" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

          <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(59, 130, 246, 0.1)", color: "var(--secondary)", display: "grid", placeItems: "center", fontSize: "32px", boxShadow: "0 0 20px rgba(59, 130, 246, 0.2)" }}>
            🎓
          </div>

          <div>

            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
              VERIFIED ACADEMIC IDENTITY
            </span>

            <h2 style={{ fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", margin: "4px 0 8px", color: "var(--text)" }}>
              {connected
                ? "Student Profile"
                : "Wallet Not Connected"}
            </h2>

            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--text-soft)" }}>
              {connected && studentDID && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ opacity: 0.6 }}>DID:</span>
                  <code style={{ fontFamily: "monospace", color: "var(--secondary-light)" }}>{studentDID}</code>
                </div>
              )}
              {walletAddress && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ opacity: 0.6 }}>Wallet:</span>
                  <code style={{ fontFamily: "monospace", color: "var(--text)" }}>{walletAddress.slice(0,6)}...{walletAddress.slice(-4)}</code>
                </div>
              )}
              {!connected && (
                <p style={{ margin: 0 }}>Connect MetaMask to access your credentials.</p>
              )}
            </div>

          </div>

        </div>

        {!connected && (
          <button
            type="button"
            className="dashboard-btn-primary"
            onClick={connectWallet}
          >
            Connect MetaMask
          </button>
        )}

      </section>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (

        <section className="student-error">

          <div className="student-error-icon">
            !
          </div>

          <div>

            <strong>
              Connection / Blockchain Error
            </strong>

            <p>
              {error}
            </p>

          </div>

        </section>

      )}

      {/* =================================================
          STATISTICS
          ================================================= */}

      <section className="dashboard-stat-grid" style={{ marginBottom: "48px" }}>

        <div className="dashboard-card">

          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
            TOTAL CREDENTIALS
          </span>

          <strong style={{ fontSize: "36px", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, color: "var(--text)", display: "block", marginBottom: "8px" }}>
            {credentials.length}
          </strong>

          <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: 0 }}>
            Issued to your DID
          </p>

        </div>

        <div className="dashboard-card">

          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
            ACTIVE & VERIFIED
          </span>

          <strong style={{ fontSize: "36px", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, color: "var(--text)", display: "block", marginBottom: "8px" }}>
            {activeCredentials.length}
          </strong>

          <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: 0 }}>
            Currently valid credentials
          </p>

        </div>

        <div className="dashboard-card">

          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--pending)", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
            SUPERSEDED
          </span>

          <strong style={{ fontSize: "36px", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, color: "var(--text)", display: "block", marginBottom: "8px" }}>
            {supersededCredentials.length}
          </strong>

          <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: 0 }}>
            Replaced by newer versions
          </p>

        </div>

        <div className="dashboard-card">

          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--error)", letterSpacing: "0.05em", display: "block", marginBottom: "8px" }}>
            REVOKED
          </span>

          <strong style={{ fontSize: "36px", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1, color: "var(--text)", display: "block", marginBottom: "8px" }}>
            {revokedCredentials.length}
          </strong>

          <p style={{ fontSize: "12px", color: "var(--text-soft)", margin: 0 }}>
            Revoked on-chain
          </p>

        </div>

      </section>

      {/* =================================================
          CREDENTIALS
          ================================================= */}

      <section>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>

          <div>
            <h2 style={{ fontSize: "24px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 4px", color: "var(--text)" }}>
              My Academic Credentials
            </h2>
            <p style={{ margin: 0, color: "var(--text-soft)", fontSize: "14px" }}>
              Credentials issued to your EduProof DID.
            </p>
          </div>

          {credentials.length > 0 && (
            <Link
              to="/student/credentials"
              className="dashboard-btn-secondary"
            >
              View all →
            </Link>
          )}

        </div>

        {loading ? (

          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: "32px", marginBottom: "16px" }}>⏳</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>Loading credentials...</h3>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>Reading credentials from Sepolia...</p>
          </div>

        ) : !connected ? (

          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>

            <div style={{ fontSize: "32px", marginBottom: "16px" }}>
              🔐
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
              Connect your wallet
            </h3>

            <p style={{ margin: "0 0 24px", color: "var(--text-soft)" }}>
              Connect your student wallet to load blockchain credentials.
            </p>

            <button
              type="button"
              className="dashboard-btn-primary"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>

          </div>

        ) : credentials.length === 0 ? (

          <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>

            <div style={{ fontSize: "32px", marginBottom: "16px" }}>
              🎓
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>
              No credentials found
            </h3>

            <p style={{ margin: 0, color: "var(--text-soft)" }}>
              No academic credentials are currently associated with this student DID.
            </p>

          </div>

        ) : (

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>

            {credentials.map(
              (credential) => (

                <Link
                  key={credential.id}
                  to={`/student/credentials/${credential.id}`}
                  className="dashboard-card"
                  style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s" }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: credential.status === 0 ? "var(--primary)" : (credential.status === 1 ? "var(--error)" : "var(--pending)") }}></div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                      CREDENTIAL #{credential.id}
                    </span>
                    <div className={`dashboard-badge ${credential.status === 0 ? 'success' : (credential.status === 1 ? 'error' : 'warning')}`}>
                      {statusText(credential.status)}
                    </div>
                  </div>

                  <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)", lineHeight: 1.3 }}>
                    {credential.degree}
                  </h3>

                  <p style={{ margin: "0 0 24px", color: "var(--text-soft)", fontSize: "14px" }}>
                    Issued by {credential.institution}
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px", flex: 1, alignContent: "start" }}>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>TYPE</span>
                      <strong style={{ fontSize: "13px", color: "var(--text)" }}>{credential.credentialType}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>VERSION</span>
                      <strong style={{ fontSize: "13px", color: "var(--text)" }}>v{credential.version}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>ISSUED</span>
                      <strong style={{ fontSize: "13px", color: "var(--text)" }}>{formatDate(credential.issueDate)}</strong>
                    </div>
                  </div>

                  <div style={{ paddingTop: "16px", borderTop: "1px solid var(--border)", color: "var(--secondary-light)", fontSize: "13px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    View Blockchain Proof <span>→</span>
                  </div>

                </Link>

              ),
            )}

          </div>

        )}

      </section>

    </StudentLayout>
  );
}