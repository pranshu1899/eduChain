import {
  type FormEvent,
  useState,
} from "react";

import {
  getReadOnlyContract,
} from "../../services/eduProof";

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

/*
 * =========================================================
 * CONTRACT STATUS MAPPING
 * =========================================================
 *
 * Solidity enum:
 *
 * 0 = NONE
 * 1 = ACTIVE
 * 2 = SUPERSEDED
 * 3 = REVOKED
 *
 * Keep this mapping identical everywhere in the frontend.
 */

function statusText(status: number) {
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

function statusClass(status: number) {
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
      month: "long",
      year: "numeric",
    },
  );
}

function shortenValue(
  value: string,
  start = 18,
  end = 12,
) {
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

export default function VerifierPage() {
  const [
    credentialId,
    setCredentialId,
  ] = useState("");

  const [
    credential,
    setCredential,
  ] = useState<Credential | null>(
    null,
  );

  const [
    signatureValid,
    setSignatureValid,
  ] = useState<boolean | null>(
    null,
  );

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
   * =========================================================
   * VERIFY CREDENTIAL
   * =========================================================
   */

  const verifyCredential =
    async (
      event: FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault();

      setError("");
      setCredential(null);
      setSignatureValid(null);
      setHasSearched(true);

      const id = Number(
        credentialId.trim(),
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

        /*
         * Read credential directly
         * from the Sepolia contract.
         */

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

        /*
         * Verify issuer signature independently.
         */

        const valid =
          await contract.verifyCredentialSignature(
            id,
          );

        setSignatureValid(
          Boolean(valid),
        );

      } catch (verificationError) {
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
   * =========================================================
   * RESET
   * =========================================================
   */

  const resetVerification =
    () => {
      setCredentialId("");
      setCredential(null);
      setSignatureValid(null);
      setError("");
      setHasSearched(false);
    };

  /*
   * =========================================================
   * IMPORTANT STATUS LOGIC
   * =========================================================
   *
   * ACTIVE = 1
   * SUPERSEDED = 2
   * REVOKED = 3
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

  return (
    <div className="verifier-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="verifier-header">

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
          Verify an Academic Credential
        </h1>

        <p className="verifier-description">
          Verify credential authenticity directly against
          the EduProof blockchain record. No university
          wallet is required.
        </p>

        {/* =================================================
            SEARCH CARD
            ================================================= */}

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
                Enter the credential ID stored on
                the EduProof blockchain.
              </p>

            </div>

          </div>

          <form
            onSubmit={
              verifyCredential
            }
            className="verifier-form"
          >

            <label
              htmlFor="credential-id"
            >
              CREDENTIAL ID
            </label>

            <div className="verifier-input-row">

              <input
                id="credential-id"
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
                disabled={loading}
              >
                {loading
                  ? "Verifying..."
                  : "Verify Credential"}
              </button>

            </div>

          </form>

        </section>

        {/* =================================================
            ERROR
            ================================================= */}

        {error && (

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

        {/* =================================================
            EMPTY STATE
            ================================================= */}

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
                Enter a credential ID above to check
                its blockchain authenticity and current
                on-chain status.
              </p>

            </section>

          )}

        {/* =================================================
            RESULT
            ================================================= */}

        {credential && (

          <section className="verifier-result">

            {/* =================================================
                RESULT HEADER
                ================================================= */}

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
                  VERIFICATION RESULT
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
                      ? "This credential has a valid issuer signature but has been revoked on-chain."
                      : isSuperseded
                        ? "This credential has been replaced by a newer version."
                        : "The credential was found, but its current status could not be determined."}

                </p>

              </div>

              <div className="verifier-result-status">

                {statusText(
                  credential.status,
                )}

              </div>

            </div>

            {/* =================================================
                CREDENTIAL INFORMATION
                ================================================= */}

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

            {/* =================================================
                CRYPTOGRAPHIC PROOF
                ================================================= */}

            <div className="verifier-section">

              <div className="verifier-section-heading">

                <span>
                  CRYPTOGRAPHIC PROOF
                </span>

                <h2>
                  Issuer Signature
                </h2>

                <p>
                  The signature is checked directly
                  against the blockchain credential.
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

            {/* =================================================
                IPFS
                ================================================= */}

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

            {/* =================================================
                VERIFY ANOTHER
                ================================================= */}

            <div className="verifier-result-actions">

              <button
                type="button"
                onClick={
                  resetVerification
                }
                className="verifier-secondary-button"
              >
                Verify Another Credential
              </button>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}