import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";

import {
  getIssuer,
  isAuthorizedIssuer,
  issueCredential,
} from "../../config/contractService";

/* =====================================================
   TYPES
   ===================================================== */

interface EthereumProvider {
  request(args: {
    method: string;
    params?: unknown[];
  }): Promise<unknown>;

  on?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;

  removeListener?: (
    event: string,
    handler: (...args: unknown[]) => void
  ) => void;
}

function getEthereum(): EthereumProvider | null {
  const ethereum = (
    window as Window & {
      ethereum?: EthereumProvider;
    }
  ).ethereum;

  return ethereum ?? null;
}

function shortenAddress(
  address: string
): string {
  if (!address) {
    return "";
  }

  if (address.length <= 18) {
    return address;
  }

  return `${address.slice(
    0,
    8
  )}...${address.slice(-6)}`;
}

/* =====================================================
   COMPONENT
   ===================================================== */

export default function IssueCredential() {
  const navigate = useNavigate();

  /* ===================================================
     FORM
     =================================================== */

  const [studentDID, setStudentDID] =
    useState("");

  const [credentialType, setCredentialType] =
    useState("B.Tech");

  const [institution, setInstitution] =
    useState("");

  const [institutionId, setInstitutionId] =
    useState("");

  const [degree, setDegree] =
    useState("Bachelor of Technology");

  const [issueDate, setIssueDate] =
    useState("");

  /* ===================================================
     WALLET
     =================================================== */

  const [walletAddress, setWalletAddress] =
    useState("");

  const [connected, setConnected] =
    useState(false);

  const [walletLoading, setWalletLoading] =
    useState(true);

  /* ===================================================
     ISSUER
     =================================================== */

  const [issuerLoading, setIssuerLoading] =
    useState(false);

  const [issuerAuthorized, setIssuerAuthorized] =
    useState(false);

  /* ===================================================
     TRANSACTION
     =================================================== */

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [transactionHash, setTransactionHash] =
    useState("");

  const [credentialId, setCredentialId] =
    useState<number | null>(null);

  /* ===================================================
     LOAD WALLET + ISSUER
     =================================================== */

  useEffect(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      setWalletLoading(false);
      setError(
        "MetaMask is not installed."
      );
      return;
    }

    const loadWallet = async () => {
      try {
        const accounts =
          (await ethereum.request({
            method: "eth_accounts",
          })) as string[];

        if (!accounts.length) {
          setWalletAddress("");
          setConnected(false);
          setIssuerAuthorized(false);
          return;
        }

        const address =
          accounts[0];

        setWalletAddress(address);
        setConnected(true);

        await loadIssuer(address);
      } catch (walletError) {
        console.error(
          "Wallet loading failed:",
          walletError
        );

        setError(
          "Unable to read the connected MetaMask wallet."
        );
      } finally {
        setWalletLoading(false);
      }
    };

    const handleAccountsChanged = (
      accounts: unknown
    ) => {
      const nextAccounts =
        accounts as string[];

      if (!nextAccounts.length) {
        setWalletAddress("");
        setConnected(false);
        setIssuerAuthorized(false);
        setInstitution("");
        setInstitutionId("");
        return;
      }

      const address =
        nextAccounts[0];

      setWalletAddress(address);
      setConnected(true);

      void loadIssuer(address);
    };

    const loadIssuer = async (
      address: string
    ) => {
      try {
        setIssuerLoading(true);
        setError("");

        const authorized =
          await isAuthorizedIssuer(
            address
          );

        setIssuerAuthorized(
          Boolean(authorized)
        );

        if (!authorized) {
          setInstitution("");
          setInstitutionId("");

          setError(
            "Connected wallet is not an authorized university issuer."
          );

          return;
        }

        const issuer =
          await getIssuer(address);

        setInstitution(
          issuer.institutionName
        );

        setInstitutionId(
          issuer.institutionId
        );
      } catch (issuerError) {
        console.error(
          "Issuer loading failed:",
          issuerError
        );

        setIssuerAuthorized(false);

        setError(
          "Unable to load university issuer information. Make sure MetaMask is connected to Ethereum Sepolia."
        );
      } finally {
        setIssuerLoading(false);
      }
    };

    /*
     * Attach account-change listener.
     */
    ethereum.on?.(
      "accountsChanged",
      handleAccountsChanged
    );

    void loadWallet();

    return () => {
      ethereum.removeListener?.(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  /* ===================================================
     CONNECT WALLET
     =================================================== */

  const connectWallet = async () => {
    const ethereum =
      getEthereum();

    if (!ethereum) {
      setError(
        "MetaMask is not installed."
      );
      return;
    }

    try {
      setWalletLoading(true);
      setError("");

      const accounts =
        (await ethereum.request({
          method:
            "eth_requestAccounts",
        })) as string[];

      if (!accounts.length) {
        throw new Error(
          "No MetaMask account was selected."
        );
      }

      const address =
        accounts[0];

      setWalletAddress(address);
      setConnected(true);

      /*
       * issuer check happens below
       * through the existing service.
       */
      const authorized =
        await isAuthorizedIssuer(
          address
        );

      setIssuerAuthorized(
        Boolean(authorized)
      );

      if (!authorized) {
        setError(
          "This wallet is not registered as an authorized EduProof university issuer."
        );

        return;
      }

      const issuer =
        await getIssuer(address);

      setInstitution(
        issuer.institutionName
      );

      setInstitutionId(
        issuer.institutionId
      );
    } catch (connectError) {
      console.error(
        "Wallet connection failed:",
        connectError
      );

      setError(
        connectError instanceof Error
          ? connectError.message
          : "Wallet connection failed."
      );
    } finally {
      setWalletLoading(false);
    }
  };

  /* ===================================================
     ISSUE CREDENTIAL
     =================================================== */

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setTransactionHash("");
    setCredentialId(null);

    /* -----------------------------------------------
       VALIDATION
       ----------------------------------------------- */

    if (!studentDID.trim()) {
      setError(
        "Please enter the student's DID."
      );
      return;
    }

    if (!degree.trim()) {
      setError(
        "Please enter the degree."
      );
      return;
    }

    if (!issueDate) {
      setError(
        "Please select the issue date."
      );
      return;
    }

    if (!connected) {
      setError(
        "Connect the university wallet before issuing a credential."
      );
      return;
    }

    if (!issuerAuthorized) {
      setError(
        "The connected wallet is not an authorized university issuer."
      );
      return;
    }

    if (!institution || !institutionId) {
      setError(
        "University issuer information could not be loaded."
      );
      return;
    }

    /* -----------------------------------------------
       ISSUE
       ----------------------------------------------- */

    try {
      setLoading(true);

      setMessage(
        "Preparing credential..."
      );

      /*
       * This single service call performs the complete
       * issuance pipeline:
       *
       * 1. Validate issuer
       * 2. Get registered institution
       * 3. Create credential hash
       * 4. University signs hash
       * 5. Create Verifiable Credential
       * 6. Upload VC to IPFS
       * 7. Send EduProof.issueCredential()
       * 8. Wait for Sepolia confirmation
       * 9. Extract credential ID
       */

      const result =
        await issueCredential(
          studentDID.trim(),
          credentialType,
          degree.trim(),
          issueDate
        );

      setCredentialId(
        result.credentialId
      );

      setTransactionHash(
        result.transactionHash
      );

      setMessage(
        "Credential issued successfully on Ethereum Sepolia."
      );
    } catch (issueError) {
      console.error(
        "Credential issuance failed:",
        issueError
      );

      let readableMessage =
        "Credential issuance failed.";

      if (
        issueError instanceof Error
      ) {
        readableMessage =
          issueError.message;
      }

      /*
       * MetaMask commonly throws this
       * when the user rejects signing.
       */
      if (
        readableMessage
          .toLowerCase()
          .includes("user rejected")
      ) {
        readableMessage =
          "Transaction was rejected in MetaMask.";
      }

      setError(
        readableMessage
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===================================================
     OPEN CREATED CREDENTIAL
     =================================================== */

  const openCredential = () => {
    if (credentialId === null) {
      return;
    }

    navigate(
      `/university/credentials/${credentialId}`
    );
  };

  /* ===================================================
     RENDER
     =================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      <div className="issue-credential-page">

        {/* =========================================
            PAGE HEADER
        ========================================== */}

        <section className="issue-page-header">

          <div>

            <div className="issue-eyebrow">
              UNIVERSITY PORTAL
            </div>

            <h1>
              Issue Credential
            </h1>

            <p>
              Create a verifiable academic credential
              secured by the EduProof blockchain network.
            </p>

          </div>

          <div className="issue-header-actions">

            <Link
              to="/university"
              className="issue-secondary-button"
            >
              ← Dashboard
            </Link>

            <Link
              to="/university/credentials"
              className="issue-secondary-button"
            >
              View Credentials
            </Link>

          </div>

        </section>

        {/* =========================================
            WALLET STATUS
        ========================================== */}

        <section className="issue-wallet-banner">

          <div className="issue-wallet-left">

            <div
              className={
                connected
                  ? "issue-wallet-dot connected"
                  : "issue-wallet-dot"
              }
            />

            <div>

              <span>
                UNIVERSITY ISSUER
              </span>

              <strong>
                {walletLoading
                  ? "Checking wallet..."
                  : connected
                    ? shortenAddress(
                        walletAddress
                      )
                    : "Wallet not connected"}
              </strong>

            </div>

          </div>

          {!connected && (
            <button
              type="button"
              className="issue-connect-button"
              onClick={
                connectWallet
              }
              disabled={
                walletLoading
              }
            >
              {walletLoading
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          )}

          {connected &&
            issuerAuthorized && (
              <div className="issue-authorized-badge">
                ✓ Authorized Issuer
              </div>
            )}

        </section>

        {/* =========================================
            MAIN GRID
        ========================================== */}

        <section className="issue-main-grid">

          {/* =======================================
              LEFT FORM
          ======================================== */}

          <div className="issue-card">

            <div className="issue-card-header">

              <div className="issue-card-icon">
                +
              </div>

              <div>

                <h2>
                  Credential Information
                </h2>

                <p>
                  Enter the academic details that will
                  become part of the credential.
                </p>

              </div>

            </div>

            <form
              className="issue-form"
              onSubmit={
                handleSubmit
              }
            >

              {/* Student DID */}

              <div className="issue-form-group full">

                <label
                  htmlFor="studentDID"
                >
                  Student DID
                </label>

                <input
                  id="studentDID"
                  type="text"
                  value={studentDID}
                  onChange={(event) =>
                    setStudentDID(
                      event.target.value
                    )
                  }
                  placeholder="did:eduproof:..."
                  required
                  disabled={
                    loading
                  }
                />

                <span>
                  Decentralized identifier of the
                  student.
                </span>

              </div>

              {/* Credential Type + Degree */}

              <div className="issue-form-row">

                <div className="issue-form-group">

                  <label
                    htmlFor="credentialType"
                  >
                    Credential Type
                  </label>

                  <select
                    id="credentialType"
                    value={
                      credentialType
                    }
                    onChange={(event) =>
                      setCredentialType(
                        event.target.value
                      )
                    }
                    disabled={
                      loading
                    }
                  >

                    <option value="B.Tech">
                      B.Tech
                    </option>

                    <option value="B.E.">
                      B.E.
                    </option>

                    <option value="B.Sc.">
                      B.Sc.
                    </option>

                    <option value="M.Tech">
                      M.Tech
                    </option>

                    <option value="M.Sc.">
                      M.Sc.
                    </option>

                    <option value="MBA">
                      MBA
                    </option>

                  </select>

                </div>

                <div className="issue-form-group">

                  <label
                    htmlFor="degree"
                  >
                    Degree
                  </label>

                  <input
                    id="degree"
                    type="text"
                    value={degree}
                    onChange={(event) =>
                      setDegree(
                        event.target.value
                      )
                    }
                    placeholder="Bachelor of Technology"
                    required
                    disabled={
                      loading
                    }
                  />

                </div>

              </div>

              {/* Institution */}

              <div className="issue-form-row">

                <div className="issue-form-group">

                  <label
                    htmlFor="institution"
                  >
                    Institution
                  </label>

                  <input
                    id="institution"
                    type="text"
                    value={
                      issuerLoading
                        ? "Loading issuer..."
                        : institution
                    }
                    readOnly
                    disabled
                  />

                  <span>
                    Loaded from the registered
                    university issuer.
                  </span>

                </div>

                <div className="issue-form-group">

                  <label
                    htmlFor="institutionId"
                  >
                    Institution ID
                  </label>

                  <input
                    id="institutionId"
                    type="text"
                    value={
                      issuerLoading
                        ? "Loading..."
                        : institutionId
                    }
                    readOnly
                    disabled
                  />

                  <span>
                    Registered on the EduProof contract.
                  </span>

                </div>

              </div>

              {/* Issue Date */}

              <div className="issue-form-group">

                <label
                  htmlFor="issueDate"
                >
                  Issue Date
                </label>

                <input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(event) =>
                    setIssueDate(
                      event.target.value
                    )
                  }
                  required
                  disabled={
                    loading
                  }
                />

              </div>

              {/* ERROR */}

              {error && (

                <div className="issue-message issue-error">

                  <span>
                    !
                  </span>

                  <p>
                    {error}
                  </p>

                </div>

              )}

              {/* SUCCESS */}

              {message && (

                <div className="issue-message issue-success">

                  <span>
                    ✓
                  </span>

                  <div>

                    <p>
                      {message}
                    </p>

                    {credentialId !== null && (
                      <strong>
                        Credential ID: #
                        {credentialId}
                      </strong>
                    )}

                  </div>

                </div>

              )}

              {/* TRANSACTION */}

              {transactionHash && (

                <div className="issue-transaction-box">

                  <span>
                    SEPOLIA TRANSACTION
                  </span>

                  <code>
                    {transactionHash}
                  </code>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on Etherscan →
                  </a>

                </div>

              )}

              {/* ACTIONS */}

              <div className="issue-form-actions">

                {credentialId !== null ? (

                  <button
                    type="button"
                    className="issue-cancel-button"
                    onClick={
                      openCredential
                    }
                  >
                    View Credential
                  </button>

                ) : (

                  <Link
                    to="/university"
                    className="issue-cancel-button"
                  >
                    Cancel
                  </Link>

                )}

                <button
                  type="submit"
                  className="issue-submit-button"
                  disabled={
                    loading ||
                    !connected ||
                    !issuerAuthorized ||
                    issuerLoading
                  }
                >

                  {loading
                    ? "Issuing on Sepolia..."
                    : "Issue Credential →"}

                </button>

              </div>

            </form>

          </div>

          {/* =======================================
              RIGHT COLUMN
          ======================================== */}

          <div className="issue-right-column">

            {/* PREVIEW */}

            <div className="issue-card">

              <div className="issue-card-header">

                <div className="issue-card-icon preview-icon">
                  ◇
                </div>

                <div>

                  <h2>
                    Credential Preview
                  </h2>

                  <p>
                    Review the information before issuing.
                  </p>

                </div>

              </div>

              <div className="credential-preview">

                <div className="preview-label">
                  EDUPROOF CREDENTIAL
                </div>

                <h3>
                  {degree ||
                    "Academic Credential"}
                </h3>

                <p className="preview-institution">
                  {institution ||
                    "Institution not connected"}
                </p>

                <div className="preview-status-row">

                  <div>
                    <span>
                      TYPE
                    </span>

                    <strong>
                      {credentialType}
                    </strong>
                  </div>

                  <div>
                    <span>
                      VERSION
                    </span>

                    <strong>
                      V1
                    </strong>
                  </div>

                  <div>
                    <span>
                      STATUS
                    </span>

                    <strong className="draft-status">
                      {credentialId !== null
                        ? "ACTIVE"
                        : "DRAFT"}
                    </strong>
                  </div>

                </div>

                <div className="preview-detail">

                  <span>
                    STUDENT DID
                  </span>

                  <strong>
                    {studentDID ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="preview-detail">

                  <span>
                    INSTITUTION ID
                  </span>

                  <strong>
                    {institutionId ||
                      "Not available"}
                  </strong>

                </div>

                <div className="preview-detail">

                  <span>
                    ISSUE DATE
                  </span>

                  <strong>
                    {issueDate ||
                      "Not selected"}
                  </strong>

                </div>

              </div>

            </div>

            {/* ISSUANCE FLOW */}

            <div className="issue-card">

              <div className="flow-heading">

                <div className="flow-heading-label">
                  BLOCKCHAIN ISSUANCE FLOW
                </div>

                <p>
                  The actual credential issuance pipeline.
                </p>

              </div>

              <div className="issuance-flow">

                <div className="issuance-step">

                  <div className="step-number">
                    01
                  </div>

                  <div className="step-content">

                    <strong>
                      Credential Metadata
                    </strong>

                    <span>
                      Academic information is prepared.
                    </span>

                  </div>

                </div>

                <div className="flow-line" />

                <div className="issuance-step">

                  <div className="step-number">
                    02
                  </div>

                  <div className="step-content">

                    <strong>
                      Cryptographic Hash
                    </strong>

                    <span>
                      Credential data is hashed using
                      the EduProof format.
                    </span>

                  </div>

                </div>

                <div className="flow-line" />

                <div className="issuance-step">

                  <div className="step-number">
                    03
                  </div>

                  <div className="step-content">

                    <strong>
                      University Signature
                    </strong>

                    <span>
                      The connected issuer wallet signs
                      the credential hash.
                    </span>

                  </div>

                </div>

                <div className="flow-line" />

                <div className="issuance-step">

                  <div className="step-number">
                    04
                  </div>

                  <div className="step-content">

                    <strong>
                      IPFS Metadata
                    </strong>

                    <span>
                      The Verifiable Credential is stored
                      off-chain.
                    </span>

                  </div>

                </div>

                <div className="flow-line" />

                <div className="issuance-step">

                  <div className="step-number">
                    05
                  </div>

                  <div className="step-content">

                    <strong>
                      Blockchain Record
                    </strong>

                    <span>
                      EduProof records the credential
                      on Ethereum Sepolia.
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </section>

      </div>
    </UniversityLayout>
  );
}