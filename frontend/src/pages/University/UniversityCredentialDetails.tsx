import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import { getReadOnlyContract } from "../../services/eduProof";

interface Credential {
  id: number;
  rootCredentialId: number;
  issuer: string;
  studentDID: string;
  credentialType: string;
  institution: string;
  institutionId: string;
  degree: string;
  issueDate: string;
  credentialHash: string;
  signature: string;
  cid: string;
  version: number;
  status: number;
  issuedAt: number;
  previousVersionId: number;
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
    return "Unknown";
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function shortValue(value: string) {
  if (!value) {
    return "Not available";
  }

  if (value.length <= 30) {
    return value;
  }

  return `${value.slice(0, 16)}...${value.slice(-12)}`;
}

function formatDate(date: string) {
  if (!date) {
    return "Unknown";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

export default function UniversityCredentialDetails() {
  const { id } = useParams<{ id: string }>();

  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [credential, setCredential] =
    useState<Credential | null>(null);

  const [versionHistory, setVersionHistory] =
    useState<number[]>([]);

  const [signatureValid, setSignatureValid] =
    useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);

  const [verificationLoading, setVerificationLoading] =
    useState(false);

  const [error, setError] = useState("");

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
     LOAD CREDENTIAL
     ===================================================== */

  useEffect(() => {
    if (!id) {
      setError("Credential ID is missing.");
      setLoading(false);
      return;
    }

    const loadCredential = async () => {
      try {
        setLoading(true);
        setError("");
        setSignatureValid(null);

        const credentialId = Number(id);

        if (
          !Number.isInteger(credentialId) ||
          credentialId <= 0
        ) {
          throw new Error(
            "Invalid credential ID.",
          );
        }

        const contract = getReadOnlyContract();

        const result =
          await contract.getCredential(
            credentialId,
          );

        const loadedCredential: Credential = {
          id: Number(result.id),

          rootCredentialId: Number(
            result.rootCredentialId,
          ),

          issuer: String(result.issuer),

          studentDID: String(
            result.studentDID,
          ),

          credentialType: String(
            result.credentialType,
          ),

          institution: String(
            result.institution,
          ),

          institutionId: String(
            result.institutionId,
          ),

          degree: String(result.degree),

          issueDate: String(
            result.issueDate,
          ),

          credentialHash: String(
            result.credentialHash,
          ),

          signature: String(
            result.signature,
          ),

          cid: String(result.cid),

          version: Number(
            result.version,
          ),

          status: Number(
            result.status,
          ),

          issuedAt: Number(
            result.issuedAt,
          ),

          previousVersionId: Number(
            result.previousVersionId,
          ),
        };

        setCredential(
          loadedCredential,
        );

        /* =================================================
           VERSION HISTORY
           ================================================= */

        try {
          const history =
            await contract.getVersionHistory(
              credentialId,
            );

          setVersionHistory(
            Array.from(history).map(
              (value) => Number(value),
            ),
          );
        } catch (historyError) {
          console.error(
            "Version history unavailable:",
            historyError,
          );

          setVersionHistory([]);
        }
      } catch (loadError) {
        console.error(
          "Failed to load credential:",
          loadError,
        );

        setError(
          "Unable to load this credential from the EduProof contract.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadCredential();
  }, [id]);

  /* =====================================================
     VERIFY SIGNATURE
     ===================================================== */

  const verifySignature = async () => {
    if (!credential) {
      return;
    }

    try {
      setVerificationLoading(true);

      const contract =
        getReadOnlyContract();

      const result =
        await contract.verifyCredentialSignature(
          credential.id,
        );

      setSignatureValid(
        Boolean(result),
      );
    } catch (verificationError) {
      console.error(
        "Signature verification failed:",
        verificationError,
      );

      setSignatureValid(false);
    } finally {
      setVerificationLoading(false);
    }
  };

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      {/* =================================================
          PAGE HEADER
          ================================================= */}

      <section className="credential-details-header">
        <div>

          <Link
            to="/university/credentials"
            className="credential-back-link"
          >
            ← Back to Credentials
          </Link>

          <span className="page-eyebrow">
            CREDENTIAL DETAILS
          </span>

          <h1>
            {loading
              ? "Loading Credential..."
              : credential
                ? `Credential #${credential.id}`
                : "Credential Not Found"}
          </h1>

          <p>
            On-chain academic credential record and
            cryptographic proof.
          </p>

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
          LOADING
          ================================================= */}

      {loading && (
        <div className="credential-details-loading">

          <div className="credential-loading-spinner" />

          <h3>
            Reading blockchain record...
          </h3>

          <p>
            Fetching credential data from EduProof
            on Sepolia.
          </p>

        </div>
      )}

      {/* =================================================
          CREDENTIAL
          ================================================= */}

      {!loading && credential && (
        <div className="credential-details-page">

          {/* =================================================
              MAIN CREDENTIAL CARD
              ================================================= */}

          <section className="credential-details-card">

            <div className="credential-details-card-header">

              <div>

                <span className="credential-card-eyebrow">
                  ACADEMIC CREDENTIAL
                </span>

                <h2>
                  {credential.credentialType}
                </h2>

                <p>
                  {credential.degree}
                </p>

              </div>

              <span
                className={`credential-status ${statusText(
                  credential.status,
                ).toLowerCase()}`}
              >
                <span className="credential-status-dot" />

                {statusText(
                  credential.status,
                )}
              </span>

            </div>

            {/* =================================================
                CORE INFORMATION
                ================================================= */}

            <div className="credential-info-grid">

              <div className="credential-info-item">

                <span>
                  Student DID
                </span>

                <strong>
                  {credential.studentDID}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Institution
                </span>

                <strong>
                  {credential.institution}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Institution ID
                </span>

                <strong>
                  {credential.institutionId}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Issue Date
                </span>

                <strong>
                  {formatDate(
                    credential.issueDate,
                  )}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Version
                </span>

                <strong>
                  v{credential.version}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Issuer
                </span>

                <strong>
                  {shortAddress(
                    credential.issuer,
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* =================================================
              CRYPTOGRAPHIC PROOF
              ================================================= */}

          <section className="credential-proof-card">

            <div className="credential-section-heading">

              <div>

                <span className="page-eyebrow">
                  BLOCKCHAIN PROOF
                </span>

                <h2>
                  Cryptographic Verification
                </h2>

                <p>
                  Proof data stored with the credential
                  record.
                </p>

              </div>

            </div>

            <div className="credential-proof-grid">

              <div className="credential-proof-item">

                <span>
                  Credential Hash
                </span>

                <code>
                  {credential.credentialHash}
                </code>

              </div>

              <div className="credential-proof-item">

                <span>
                  IPFS CID
                </span>

                <code>
                  {credential.cid ||
                    "Not available"}
                </code>

              </div>

              <div className="credential-proof-item full">

                <span>
                  Signature
                </span>

                <code>
                  {shortValue(
                    credential.signature,
                  )}
                </code>

              </div>

            </div>

            <div className="credential-verification-actions">

              <button
                type="button"
                className="primary-button"
                onClick={verifySignature}
                disabled={
                  verificationLoading
                }
              >
                {verificationLoading
                  ? "Verifying..."
                  : "Verify Signature"}
              </button>

              {signatureValid !== null && (
                <div
                  className={
                    signatureValid
                      ? "signature-result valid"
                      : "signature-result invalid"
                  }
                >

                  <span>
                    {signatureValid
                      ? "✓"
                      : "×"}
                  </span>

                  {signatureValid
                    ? "Cryptographic signature is valid"
                    : "Cryptographic signature is invalid"}

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              VERSION HISTORY
              ================================================= */}

          <section className="credential-history-card">

            <div className="credential-section-heading">

              <div>

                <span className="page-eyebrow">
                  VERSION CONTROL
                </span>

                <h2>
                  Version History
                </h2>

                <p>
                  Blockchain-linked versions of this
                  credential.
                </p>

              </div>

            </div>

            {versionHistory.length === 0 ? (

              <div className="credential-history-empty">
                No version history available.
              </div>

            ) : (

              <div className="credential-history-list">

                {versionHistory.map(
                  (versionId, index) => (
                    <div
                      key={`${versionId}-${index}`}
                      className="credential-history-item"
                    >

                      <div className="history-number">
                        {index + 1}
                      </div>

                      <div>

                        <strong>
                          Credential #{versionId}
                        </strong>

                        <span>
                          Version {index + 1}
                        </span>

                      </div>

                      {versionId ===
                        credential.id && (
                        <span className="history-current">
                          CURRENT
                        </span>
                      )}

                    </div>
                  ),
                )}

              </div>

            )}

          </section>

          {/* =================================================
              ON-CHAIN IDENTIFIERS
              ================================================= */}

          <section className="credential-identifiers-card">

            <div className="credential-section-heading">

              <div>

                <span className="page-eyebrow">
                  ON-CHAIN IDENTIFIERS
                </span>

                <h2>
                  Record Information
                </h2>

              </div>

            </div>

            <div className="credential-info-grid">

              <div className="credential-info-item">

                <span>
                  Credential ID
                </span>

                <strong>
                  #{credential.id}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Root Credential
                </span>

                <strong>
                  #{credential.rootCredentialId}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Previous Version
                </span>

                <strong>
                  {credential.previousVersionId
                    ? `#${credential.previousVersionId}`
                    : "None"}
                </strong>

              </div>

              <div className="credential-info-item">

                <span>
                  Issued At
                </span>

                <strong>
                  {credential.issuedAt
                    ? new Date(
                        credential.issuedAt * 1000,
                      ).toLocaleString(
                        "en-IN",
                      )
                    : "Unknown"}
                </strong>

              </div>

            </div>

          </section>

        </div>
      )}

    </UniversityLayout>
  );
}