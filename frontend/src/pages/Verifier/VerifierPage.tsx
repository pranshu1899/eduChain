import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
  useSearchParams,
} from "react-router-dom";

import {
  getReadOnlyContract,
} from "../../services/eduProof";

import {
  EVIDENCE_REGISTRY_ADDRESS,
  verifyEvidenceIntegrity,
} from "../../services/evidenceRegistry";

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

interface EvidenceVerification {
  verified: boolean;
  exists: boolean;
  ownerMatches: boolean;
  active: boolean;
  owner: string;
  anchoredAt: number;
  status: number;
  reason: string;
}

const SEPOLIA_EXPLORER =
  "https://sepolia.etherscan.io";


/*
 * =========================================================
 * CREDENTIAL STATUS
 * =========================================================
 */

function statusText(
  status: number,
): string {
  switch (status) {
    case 0:
      return "NONE";

    case 1:
      return "ACTIVE";

    case 2:
      return "SUPERSEDED";

    case 3:
      return "REVOKED";

    default:
      return "UNKNOWN";
  }
}

function statusClass(
  status: number,
): string {
  switch (status) {
    case 1:
      return "verified";

    case 2:
      return "superseded";

    case 3:
      return "revoked";

    default:
      return "unknown";
  }
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatDate(
  date: string,
): string {
  if (!date) {
    return "Unknown";
  }

  const parsed =
    new Date(date);

  if (
    Number.isNaN(
      parsed.getTime(),
    )
  ) {
    return date;
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function formatTimestamp(
  timestamp: number,
): string {
  if (!timestamp) {
    return "Not available";
  }

  return new Date(
    timestamp * 1000,
  ).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function shortenValue(
  value: string,
  start = 18,
  end = 12,
): string {
  if (!value) {
    return "Not available";
  }

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return `${value.slice(
    0,
    start,
  )}...${value.slice(-end)}`;
}

function isValidBytes32Hash(
  value: string,
): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(
    value.trim(),
  );
}

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function VerifierPage() {
  const {
    id: routeCredentialId,
  } = useParams<{
    id?: string;
  }>();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  /*
   * =======================================================
   * EVIDENCE URL
   * =======================================================
   *
   * QR codes use:
   *
   * /verify?hash=0x...
   */

  const evidenceHashFromUrl =
    searchParams.get(
      "hash",
    ) ?? "";

  const isEvidenceMode =
    Boolean(
      evidenceHashFromUrl.trim(),
    );

  /*
   * =======================================================
   * CREDENTIAL STATE
   * =======================================================
   */

  const [
    credentialId,
    setCredentialId,
  ] = useState(
    routeCredentialId ?? "",
  );

  const [
    credential,
    setCredential,
  ] =
    useState<Credential | null>(
      null,
    );

  const [
    signatureValid,
    setSignatureValid,
  ] =
    useState<boolean | null>(
      null,
    );

  /*
   * =======================================================
   * EVIDENCE STATE
   * =======================================================
   */

  const [
    evidenceHash,
    setEvidenceHash,
  ] = useState(
    evidenceHashFromUrl,
  );

  const [
    evidenceVerification,
    setEvidenceVerification,
  ] =
    useState<EvidenceVerification | null>(
      null,
    );

  /*
   * =======================================================
   * GENERAL STATE
   * =======================================================
   */

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    hasSearched,
    setHasSearched,
  ] = useState(false);

  /*
   * =======================================================
   * VERIFY CREDENTIAL
   * =======================================================
   */

  const verifyCredential =
    async (
      idValue: string,
    ): Promise<void> => {
      setError("");
      setCredential(null);
      setSignatureValid(null);
      setHasSearched(true);

      const id =
        Number(
          idValue.trim(),
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        setError(
          "Enter a valid credential ID.",
        );

        return;
      }

      try {
        setLoading(true);

        const contract =
          getReadOnlyContract();

        const result =
          await contract.getCredential(
            id,
          );

        const loadedCredential:
          Credential = {
          id: Number(
            result.id,
          ),

          rootCredentialId:
            Number(
              result.rootCredentialId,
            ),

          issuer:
            String(
              result.issuer,
            ),

          studentDID:
            String(
              result.studentDID,
            ),

          credentialType:
            String(
              result.credentialType,
            ),

          institution:
            String(
              result.institution,
            ),

          institutionId:
            String(
              result.institutionId,
            ),

          degree:
            String(
              result.degree,
            ),

          issueDate:
            String(
              result.issueDate,
            ),

          credentialHash:
            String(
              result.credentialHash,
            ),

          signature:
            String(
              result.signature,
            ),

          cid:
            String(
              result.cid,
            ),

          version:
            Number(
              result.version,
            ),

          status:
            Number(
              result.status,
            ),

          issuedAt:
            Number(
              result.issuedAt,
            ),

          previousVersionId:
            Number(
              result.previousVersionId,
            ),
        };

        setCredential(
          loadedCredential,
        );

        const valid =
          await contract.verifyCredentialSignature(
            id,
          );

        setSignatureValid(
          Boolean(valid),
        );
      } catch (
        verificationError
      ) {
        console.error(
          "Credential verification failed:",
          verificationError,
        );

        setError(
          "Credential not found or could not be read from the Sepolia blockchain.",
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * =======================================================
   * VERIFY EVIDENCE
   * =======================================================
   *
   * This is a public, read-only blockchain verification.
   *
   * No wallet is required.
   */

  const verifyEvidence =
    async (
      hashValue: string,
    ): Promise<void> => {
      const normalizedHash =
        hashValue.trim();

      setError("");
      setEvidenceVerification(
        null,
      );
      setHasSearched(true);

      if (!normalizedHash) {
        setError(
          "Enter an evidence hash.",
        );

        return;
      }

      if (
        !isValidBytes32Hash(
          normalizedHash,
        )
      ) {
        setError(
          "Invalid evidence hash. Expected a 32-byte hexadecimal hash beginning with 0x.",
        );

        return;
      }

      try {
        setLoading(true);

        /*
         * Read directly from the deployed
         * EvidenceRegistry contract.
         *
         * No MetaMask is needed.
         */
        const verification =
          await verifyEvidenceIntegrity(
            normalizedHash,
          );

        setEvidenceVerification(
          verification,
        );

        /*
         * Keep the URL shareable.
         *
         * This is also the URL embedded
         * inside the QR code.
         */
        if (
          evidenceHashFromUrl.trim() !==
          normalizedHash
        ) {
          setSearchParams(
            {
              hash:
                normalizedHash,
            },
            {
              replace: true,
            },
          );
        }
      } catch (
        verificationError
      ) {
        console.error(
          "Evidence verification failed:",
          verificationError,
        );

        setError(
          verificationError instanceof Error
            ? verificationError.message
            : "Unable to verify evidence against Ethereum Sepolia.",
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * =======================================================
   * AUTO VERIFY QR
   * =======================================================
   */

  useEffect(() => {
    if (
      evidenceHashFromUrl.trim()
    ) {
      setEvidenceHash(
        evidenceHashFromUrl.trim(),
      );

      void verifyEvidence(
        evidenceHashFromUrl.trim(),
      );

      return;
    }

    if (
      routeCredentialId
    ) {
      setCredentialId(
        routeCredentialId,
      );

      void verifyCredential(
        routeCredentialId,
      );
    }
  }, [
    routeCredentialId,
    evidenceHashFromUrl,
  ]);

  /*
   * =======================================================
   * MANUAL CREDENTIAL SUBMIT
   * =======================================================
   */

  const handleCredentialSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      await verifyCredential(
        credentialId,
      );
    };

  /*
   * =======================================================
   * MANUAL EVIDENCE SUBMIT
   * =======================================================
   */

  const handleEvidenceSubmit =
    async (
      event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
      event.preventDefault();

      await verifyEvidence(
        evidenceHash,
      );
    };

  /*
   * =======================================================
   * RESET
   * =======================================================
   */

  const resetVerification =
    (): void => {
      setCredentialId("");
      setCredential(null);
      setSignatureValid(null);

      setEvidenceHash("");
      setEvidenceVerification(
        null,
      );

      setError("");
      setHasSearched(false);

      setSearchParams(
        {},
        {
          replace: true,
        },
      );
    };

  /*
   * =======================================================
   * CREDENTIAL DERIVED STATE
   * =======================================================
   */

  const isActive =
    credential !== null &&
    credential.status === 1;

  const isSuperseded =
    credential !== null &&
    credential.status === 2;

  const isRevoked =
    credential !== null &&
    credential.status === 3;

  const isActuallyValid =
    credential !== null &&
    signatureValid === true &&
    isActive;

  /*
   * =======================================================
   * EVIDENCE DERIVED STATE
   * =======================================================
   */

  const evidenceIsVerified =
    evidenceVerification?.verified ===
    true;

  const evidenceExists =
    evidenceVerification?.exists ===
    true;

  const evidenceIsActive =
    evidenceVerification?.active ===
    true;

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <div className="verifier-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="verifier-header">

        <Link
          to="/"
          style={{
            textDecoration:
              "none",
            color:
              "inherit",
          }}
        >
          <div className="verifier-brand">

            <div className="verifier-brand-mark">
              E
            </div>

            <div>

              <div className="verifier-brand-name">
                EduProof
              </div>

              <div className="verifier-brand-subtitle">
                Decentralized Academic Credentials
              </div>

            </div>

          </div>
        </Link>

        <div className="verifier-network">

          <span />

          Ethereum Sepolia

        </div>

      </header>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="verifier-main">

        <div className="verifier-eyebrow">
          PUBLIC VERIFICATION CENTER
        </div>

        <h1>
          Verify on the Blockchain
        </h1>

        <p className="verifier-description">
          Verify academic credentials and achievement
          evidence directly against EduProof records
          anchored on Ethereum Sepolia.
        </p>

        {/* =================================================
            EVIDENCE VERIFICATION
            ================================================= */}

        <section className="verifier-search-card">

          <div className="verifier-search-heading">

            <div className="verifier-search-icon">
              ◈
            </div>

            <div>

              <h2>
                Evidence Verification
              </h2>

              <p>
                Verify a cryptographic evidence commitment
                directly against Ethereum Sepolia.
                No wallet is required.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleEvidenceSubmit
            }
            className="verifier-form"
          >

            <label>
              EVIDENCE HASH
            </label>

            <div className="verifier-input-row">

              <input
                type="text"
                value={
                  evidenceHash
                }
                onChange={(
                  event,
                ) => {
                  setEvidenceHash(
                    event.target.value,
                  );

                  setEvidenceVerification(
                    null,
                  );

                  setError("");
                }}
                placeholder="0x..."
                spellCheck={
                  false
                }
              />

              <button
                type="submit"
                disabled={
                  loading
                }
              >
                {loading
                  ? "Verifying..."
                  : "Verify Evidence"}
              </button>

            </div>

          </form>

        </section>

        {/* =================================================
            EVIDENCE ERROR
            ================================================= */}

        {isEvidenceMode &&
          error && (

          <section className="verifier-error">

            <div className="verifier-error-icon">
              !
            </div>

            <div>

              <strong>
                Evidence verification failed
              </strong>

              <p>
                {error}
              </p>

            </div>

          </section>
        )}

        {/* =================================================
            EVIDENCE RESULT
            ================================================= */}

        {evidenceVerification && (

          <section className="verifier-result">

            {/* RESULT BANNER */}

            <div
              className={`verifier-result-banner ${
                evidenceIsVerified
                  ? "verified"
                  : evidenceExists
                    ? "revoked"
                    : "unknown"
              }`}
            >

              <div className="verifier-result-symbol">

                {evidenceIsVerified
                  ? "✓"
                  : "×"}

              </div>

              <div>

                <span>
                  EVIDENCE VERIFICATION RESULT
                </span>

                <h2>
                  {evidenceIsVerified
                    ? "Evidence Verified"
                    : evidenceExists
                      ? "Evidence Not Active"
                      : "Evidence Not Anchored"}
                </h2>

                <p>
                  {
                    evidenceVerification.reason
                  }
                </p>

              </div>

              <div className="verifier-result-status">

                {evidenceIsVerified
                  ? "VERIFIED"
                  : evidenceExists
                    ? "REVOKED / INVALID"
                    : "NOT ANCHORED"}

              </div>

            </div>

            {/* BLOCKCHAIN RECORD */}

            <div className="verifier-section">

              <div className="verifier-section-heading">

                <span>
                  SEPOLIA EVIDENCE RECORD
                </span>

                <h2>
                  Cryptographic Commitment
                </h2>

                <p>
                  These values are read from the deployed
                  EvidenceRegistry smart contract.
                </p>

              </div>

              <div className="verifier-info-grid">

                <div className="verifier-info-item">

                  <span>
                    HASH EXISTS
                  </span>

                  <strong>
                    {evidenceExists
                      ? "YES"
                      : "NO"}
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    ON-CHAIN STATUS
                  </span>

                  <strong>
                    {evidenceExists
                      ? evidenceIsActive
                        ? "ACTIVE"
                        : "REVOKED"
                      : "NOT FOUND"}
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    OWNER
                  </span>

                  <strong
                    style={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {evidenceVerification.owner
                      ? shortenValue(
                          evidenceVerification.owner,
                        )
                      : "Not available"}
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    OWNER MATCH
                  </span>

                  <strong>
                    {evidenceExists
                      ? evidenceVerification.ownerMatches
                        ? "YES"
                        : "NOT PROVIDED"
                      : "N/A"}
                  </strong>

                </div>

              </div>

              {evidenceExists && (

                <div
                  className="verifier-proof-grid"
                  style={{
                    marginTop:
                      "22px",
                  }}
                >

                  <div className="verifier-proof-field">

                    <span>
                      EVIDENCE HASH
                    </span>

                    <code>
                      {
                        evidenceHash
                      }
                    </code>

                  </div>

                  <div className="verifier-proof-field">

                    <span>
                      ON-CHAIN OWNER
                    </span>

                    <code>
                      {
                        evidenceVerification.owner
                      }
                    </code>

                  </div>

                  <div className="verifier-proof-field">

                    <span>
                      ANCHORED AT
                    </span>

                    <strong>
                      {formatTimestamp(
                        evidenceVerification.anchoredAt,
                      )}
                    </strong>

                  </div>

                  <div className="verifier-proof-field">

                    <span>
                      NETWORK
                    </span>

                    <strong>
                      Ethereum Sepolia
                    </strong>

                  </div>

                </div>

              )}

              {/* CONTRACT */}

              <div
                className="verifier-proof-field"
                style={{
                  marginTop:
                    "22px",
                }}
              >

                <span>
                  EVIDENCE REGISTRY CONTRACT
                </span>

                <code
                  style={{
                    wordBreak:
                      "break-all",
                  }}
                >
                  {
                    EVIDENCE_REGISTRY_ADDRESS
                  }
                </code>

                <a
                  href={`${SEPOLIA_EXPLORER}/address/${EVIDENCE_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="student-view-all"
                  style={{
                    display:
                      "inline-block",
                    marginTop:
                      "10px",
                  }}
                >
                  View contract on Sepolia →
                </a>

              </div>

            </div>

            {/* WHAT THE BLOCKCHAIN PROVES */}

            <div className="verifier-section">

              <div className="verifier-section-heading">

                <span>
                  CRYPTOGRAPHIC TRUST MODEL
                </span>

                <h2>
                  What this verification proves
                </h2>

                <p>
                  The verifier checks the commitment recorded
                  by the deployed smart contract. The original
                  project files are not stored on-chain.
                </p>

              </div>

              <div className="verifier-info-grid">

                <div className="verifier-info-item">

                  <span>
                    COMMITMENT
                  </span>

                  <strong>
                    {evidenceExists
                      ? "FOUND ON-CHAIN"
                      : "NOT FOUND"}
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    INTEGRITY ANCHOR
                  </span>

                  <strong>
                    Ethereum Sepolia
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    CURRENT STATUS
                  </span>

                  <strong>
                    {evidenceExists
                      ? evidenceIsActive
                        ? "ACTIVE"
                        : "REVOKED"
                      : "UNKNOWN"}
                  </strong>

                </div>

                <div className="verifier-info-item">

                  <span>
                    VERIFICATION MODE
                  </span>

                  <strong>
                    READ ONLY
                  </strong>

                </div>

              </div>

            </div>

            {/* EXPLORER */}

            {evidenceExists && (

              <div className="verifier-result-actions">

                <a
                  href={`${SEPOLIA_EXPLORER}/address/${EVIDENCE_REGISTRY_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="student-view-all"
                >
                  Inspect EvidenceRegistry on Sepolia →
                </a>

                <button
                  type="button"
                  onClick={
                    resetVerification
                  }
                  className="verifier-secondary-button"
                >
                  Verify Another
                </button>

              </div>

            )}

          </section>

        )}

        {/* =================================================
            CREDENTIAL VERIFICATION
            ================================================= */}

        {!isEvidenceMode && (
          <>
            <section className="verifier-search-card">

              <div className="verifier-search-heading">

                <div className="verifier-search-icon">
                  ✓
                </div>

                <div>

                  <h2>
                    Credential Verification
                  </h2>

                  <p>
                    Verify a credential directly from
                    the EduProof credential registry.
                  </p>

                </div>

              </div>

              <form
                onSubmit={
                  handleCredentialSubmit
                }
                className="verifier-form"
              >

                <label>
                  CREDENTIAL ID
                </label>

                <div className="verifier-input-row">

                  <input
                    type="number"
                    min="1"
                    value={
                      credentialId
                    }
                    onChange={(event) =>
                      setCredentialId(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 1"
                  />

                  <button
                    type="submit"
                    disabled={
                      loading
                    }
                  >
                    {loading
                      ? "Verifying..."
                      : "Verify Credential"}
                  </button>

                </div>

              </form>

            </section>

            {error &&
              !isEvidenceMode && (

              <section className="verifier-error">

                <div className="verifier-error-icon">
                  !
                </div>

                <div>

                  <strong>
                    Verification failed
                  </strong>

                  <p>
                    {error}
                  </p>

                </div>

              </section>
            )}

            {!loading &&
              !credential &&
              !error &&
              !hasSearched && (

                <section className="verifier-empty">

                  <div className="verifier-empty-icon">
                    ◇
                  </div>

                  <h3>
                    Ready to verify
                  </h3>

                  <p>
                    Enter a credential ID or use an
                    EduProof verification QR code.
                  </p>

                </section>

              )}

            {credential && (

              <section className="verifier-result">

                <div
                  className={`verifier-result-banner ${statusClass(
                    credential.status,
                  )}`}
                >

                  <div className="verifier-result-symbol">

                    {isActuallyValid
                      ? "✓"
                      : isRevoked
                        ? "×"
                        : isSuperseded
                          ? "↻"
                          : "!"}

                  </div>

                  <div>

                    <span>
                      CREDENTIAL VERIFICATION RESULT
                    </span>

                    <h2>

                      {isActuallyValid
                        ? "Credential Verified"
                        : isRevoked
                          ? "Credential Revoked"
                          : isSuperseded
                            ? "Credential Superseded"
                            : "Credential Status Unknown"}

                    </h2>

                    <p>

                      {isActuallyValid
                        ? "This credential has a valid issuer signature and is currently active on-chain."
                        : isRevoked
                          ? "This credential has been revoked on-chain."
                          : isSuperseded
                            ? "This credential has been replaced by a newer version."
                            : "The credential was found, but could not be fully verified."}

                    </p>

                  </div>

                  <div className="verifier-result-status">

                    {statusText(
                      credential.status,
                    )}

                  </div>

                </div>

                <div className="verifier-section">

                  <div className="verifier-section-heading">

                    <span>
                      CREDENTIAL RECORD
                    </span>

                    <h2>
                      {credential.degree}
                    </h2>

                    <p>
                      {credential.institution}
                    </p>

                  </div>

                  <div className="verifier-info-grid">

                    <div className="verifier-info-item">

                      <span>
                        CREDENTIAL ID
                      </span>

                      <strong>
                        #{credential.id}
                      </strong>

                    </div>

                    <div className="verifier-info-item">

                      <span>
                        CREDENTIAL TYPE
                      </span>

                      <strong>
                        {
                          credential.credentialType
                        }
                      </strong>

                    </div>

                    <div className="verifier-info-item">

                      <span>
                        ISSUE DATE
                      </span>

                      <strong>
                        {formatDate(
                          credential.issueDate,
                        )}
                      </strong>

                    </div>

                    <div className="verifier-info-item">

                      <span>
                        VERSION
                      </span>

                      <strong>
                        v{credential.version}
                      </strong>

                    </div>

                    <div className="verifier-info-item">

                      <span>
                        INSTITUTION ID
                      </span>

                      <strong>
                        {
                          credential.institutionId
                        }
                      </strong>

                    </div>

                    <div className="verifier-info-item">

                      <span>
                        ON-CHAIN STATUS
                      </span>

                      <strong
                        className={`verifier-status-text ${statusClass(
                          credential.status,
                        )}`}
                      >
                        {statusText(
                          credential.status,
                        )}
                      </strong>

                    </div>

                  </div>

                </div>

                <div className="verifier-section">

                  <div className="verifier-section-heading">

                    <span>
                      CRYPTOGRAPHIC PROOF
                    </span>

                    <h2>
                      Issuer Signature
                    </h2>

                    <p>
                      The signature is independently
                      checked against the blockchain record.
                    </p>

                  </div>

                  <div className="verifier-proof-result">

                    <div
                      className={
                        signatureValid === true
                          ? "verifier-proof-icon valid"
                          : "verifier-proof-icon invalid"
                      }
                    >
                      {signatureValid === true
                        ? "✓"
                        : "×"}
                    </div>

                    <div>

                      <strong>

                        {signatureValid === true
                          ? "Signature Valid"
                          : "Signature Invalid"}

                      </strong>

                      <span>

                        {signatureValid === true
                          ? "The credential was signed by the registered issuer."
                          : "The issuer signature could not be verified."}

                      </span>

                    </div>

                  </div>

                  <div className="verifier-proof-grid">

                    <div className="verifier-proof-field">

                      <span>
                        ISSUER WALLET
                      </span>

                      <strong>
                        {shortenValue(
                          credential.issuer,
                        )}
                      </strong>

                      <code>
                        {
                          credential.issuer
                        }
                      </code>

                    </div>

                    <div className="verifier-proof-field">

                      <span>
                        STUDENT DID
                      </span>

                      <strong>
                        {shortenValue(
                          credential.studentDID,
                        )}
                      </strong>

                      <code>
                        {
                          credential.studentDID
                        }
                      </code>

                    </div>

                    <div className="verifier-proof-field">

                      <span>
                        CREDENTIAL HASH
                      </span>

                      <strong>
                        {shortenValue(
                          credential.credentialHash,
                        )}
                      </strong>

                      <code>
                        {
                          credential.credentialHash
                        }
                      </code>

                    </div>

                  </div>

                </div>

                <div className="verifier-section">

                  <div className="verifier-section-heading">

                    <span>
                      DECENTRALIZED STORAGE
                    </span>

                    <h2>
                      IPFS Metadata
                    </h2>

                  </div>

                  <div className="verifier-ipfs">

                    <div className="verifier-ipfs-icon">
                      ◈
                    </div>

                    <div>

                      <span>
                        IPFS CID
                      </span>

                      <strong>
                        {
                          credential.cid ||
                          "No CID available"
                        }
                      </strong>

                      {credential.cid && (

                        <a
                          href={`https://ipfs.io/ipfs/${credential.cid}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open credential metadata →
                        </a>

                      )}

                    </div>

                  </div>

                </div>

                <div className="verifier-result-actions">

                  <button
                    type="button"
                    onClick={
                      resetVerification
                    }
                    className="verifier-secondary-button"
                  >
                    Verify Another
                  </button>

                </div>

              </section>

            )}
          </>
        )}

        {/* =================================================
            TRUST MODEL
            ================================================= */}

        <section
          className="student-panel"
          style={{
            marginTop:
              "24px",
          }}
        >

          <div className="student-panel-header">

            <div>

              <span>
                TRUST MODEL
              </span>

              <h2>
                Verification without blind trust
              </h2>

              <p>
                EduProof reads the blockchain commitment
                directly instead of asking the verifier
                to trust a screenshot or centralized database.
              </p>

            </div>

          </div>

          <div className="student-credential-grid">

            <div className="student-credential-card">

              <h3>
                01. Cryptographic Hash
              </h3>

              <p>
                Evidence is represented by a deterministic
                cryptographic commitment.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                02. Ethereum Sepolia
              </h3>

              <p>
                The commitment is anchored in the deployed
                EvidenceRegistry smart contract.
              </p>

            </div>

            <div className="student-credential-card">

              <h3>
                03. Public Verification
              </h3>

              <p>
                Anyone with the verification link or QR
                can perform a read-only blockchain check.
              </p>

            </div>

          </div>

        </section>

        <div
          style={{
            textAlign:
              "center",
            marginTop:
              "28px",
          }}
        >

          <Link
            to="/"
            className="student-back-link"
          >
            ← Return to EduProof
          </Link>

        </div>

      </main>

    </div>
  );
}