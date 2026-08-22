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

function statusClass(status: number) {
  if (status === 0) {
    return "active";
  }

  if (status === 1) {
    return "revoked";
  }

  if (status === 2) {
    return "superseded";
  }

  return "unknown";
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

      <section className="student-page-header">

        <div>

          <span className="student-page-eyebrow">
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
          WALLET
          ================================================= */}

      <section className="student-identity-card">

        <div className="student-identity-main">

          <div className="student-identity-icon">
            🎓
          </div>

          <div>

            <span>
              CREDENTIAL OWNER
            </span>

            <h2>
              {connected
                ? "Student Wallet Connected"
                : "Wallet Not Connected"}
            </h2>

            <p>
              {walletAddress ||
                "Connect MetaMask to access your credentials."}
            </p>

          </div>

        </div>

        {!connected && (

          <button
            type="button"
            className="student-connect-large"
            onClick={
              connectWallet
            }
          >
            Connect MetaMask
          </button>

        )}

      </section>

      {/* =================================================
          DID
          ================================================= */}

      {connected && (

        <section className="student-did-card">

          <div>

            <span>
              YOUR EDUPROOF DID
            </span>

            <strong>
              {studentDID}
            </strong>

          </div>

          <div className="student-did-badge">
            DID
          </div>

        </section>

      )}

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

      <section className="student-stat-grid">

        <div className="student-stat-card purple">

          <span>
            TOTAL CREDENTIALS
          </span>

          <strong>
            {credentials.length}
          </strong>

          <p>
            Credentials associated with your DID
          </p>

        </div>

        <div className="student-stat-card green">

          <span>
            ACTIVE
          </span>

          <strong>
            {activeCredentials.length}
          </strong>

          <p>
            Currently valid credentials
          </p>

        </div>

        <div className="student-stat-card yellow">

          <span>
            SUPERSEDED
          </span>

          <strong>
            {supersededCredentials.length}
          </strong>

          <p>
            Replaced by newer versions
          </p>

        </div>

        <div className="student-stat-card red">

          <span>
            REVOKED
          </span>

          <strong>
            {revokedCredentials.length}
          </strong>

          <p>
            Revoked on-chain
          </p>

        </div>

      </section>

      {/* =================================================
          CREDENTIALS
          ================================================= */}

      <section className="student-panel">

        <div className="student-panel-header">

          <div>

            <span>
              BLOCKCHAIN RECORDS
            </span>

            <h2>
              My Academic Credentials
            </h2>

            <p>
              Credentials issued to your EduProof DID.
            </p>

          </div>

          {credentials.length > 0 && (

            <Link
              to="/student/credentials"
              className="student-view-all"
            >
              View all →
            </Link>

          )}

        </div>

        {loading ? (

          <div className="student-loading">

            <div className="credential-loading-spinner" />

            <p>
              Reading credentials from Sepolia...
            </p>

          </div>

        ) : !connected ? (

          <div className="student-empty">

            <div className="student-empty-icon">
              🔐
            </div>

            <h3>
              Connect your wallet
            </h3>

            <p>
              Connect your student wallet to load
              blockchain credentials.
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

        ) : credentials.length === 0 ? (

          <div className="student-empty">

            <div className="student-empty-icon">
              🎓
            </div>

            <h3>
              No credentials found
            </h3>

            <p>
              No academic credentials are currently
              associated with this student DID.
            </p>

          </div>

        ) : (

          <div className="student-credential-grid">

            {credentials.map(
              (credential) => (

                <Link
                  key={
                    credential.id
                  }
                  to={`/student/credentials/${credential.id}`}
                  className="student-credential-card"
                >

                  <div className="student-credential-top">

                    <span>
                      CREDENTIAL #
                      {
                        credential.id
                      }
                    </span>

                    <span
                      className={`student-status ${statusClass(
                        credential.status,
                      )}`}
                    >

                      <span />

                      {statusText(
                        credential.status,
                      )}

                    </span>

                  </div>

                  <h3>
                    {credential.degree}
                  </h3>

                  <p>
                    {credential.institution}
                  </p>

                  <div className="student-credential-details">

                    <div>

                      <span>
                        TYPE
                      </span>

                      <strong>
                        {
                          credential.credentialType
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        VERSION
                      </span>

                      <strong>
                        v
                        {
                          credential.version
                        }
                      </strong>

                    </div>

                    <div>

                      <span>
                        ISSUED
                      </span>

                      <strong>
                        {formatDate(
                          credential.issueDate,
                        )}
                      </strong>

                    </div>

                  </div>

                  <div className="student-card-action">

                    View Credential

                    <span>
                      →
                    </span>

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