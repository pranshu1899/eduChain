import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import { getReadOnlyContract } from "../../services/eduProof";

interface Credential {
  id: number;
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

function statusText(status: number) {
  if (status === 0) return "ACTIVE";
  if (status === 1) return "REVOKED";
  if (status === 2) return "SUPERSEDED";

  return "UNKNOWN";
}

function statusClass(status: number) {
  if (status === 0) return "active";
  if (status === 1) return "revoked";
  if (status === 2) return "superseded";

  return "unknown";
}

function formatDate(date: string) {
  if (!date) return "Unknown";

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

function shortAddress(address: string) {
  if (!address) return "Unknown";

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function shortValue(value: string) {
  if (!value) return "Not available";

  if (value.length <= 34) {
    return value;
  }

  return `${value.slice(0, 18)}...${value.slice(-12)}`;
}

export default function UniversityVerify() {
  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [credentialId, setCredentialId] = useState("");

  const [credential, setCredential] =
    useState<Credential | null>(null);

  const [signatureValid, setSignatureValid] =
    useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     WALLET
     ===================================================== */

  useState(() => {
    const ethereum = getEthereum();

    if (!ethereum) {
      return;
    }

    ethereum
      .request({
        method: "eth_accounts",
      })
      .then((result) => {
        const accounts = result as string[];

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setConnected(true);
        }
      })
      .catch((walletError) => {
        console.error(
          "Wallet detection failed:",
          walletError,
        );
      });
  });

  /* =====================================================
     VERIFY CREDENTIAL
     ===================================================== */

  const handleVerify = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setCredential(null);
    setSignatureValid(null);

    const parsedId = Number(
      credentialId.trim(),
    );

    if (
      !credentialId.trim() ||
      !Number.isInteger(parsedId) ||
      parsedId <= 0
    ) {
      setError(
        "Enter a valid positive credential ID.",
      );

      return;
    }

    try {
      setLoading(true);

      const contract =
        getReadOnlyContract();

      /*
       * Read the credential directly from the
       * EduProof contract.
       */

      const result =
        await contract.getCredential(
          parsedId,
        );

      const loadedCredential: Credential = {
        id: Number(result.id),
        issuer: String(result.issuer),
        studentDID: String(result.studentDID),
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
        version: Number(result.version),
        status: Number(result.status),
      };

      setCredential(
        loadedCredential,
      );

      /*
       * Verify the cryptographic signature
       * through the smart contract.
       */

      const valid =
        await contract.verifyCredentialSignature(
          parsedId,
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
        "Credential could not be found or verified on the EduProof blockchain.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCredentialId("");
    setCredential(null);
    setSignatureValid(null);
    setError("");
  };

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
            BLOCKCHAIN VERIFICATION
          </span>

          <h1>
            Verify Credential
          </h1>

          <p>
            Verify an academic credential directly
            against the EduProof smart contract.
          </p>
        </div>

        <div className="university-page-actions">
          <Link
            to="/university/credentials"
            className="secondary-button"
          >
            View Credentials
          </Link>
        </div>
      </section>

      {/* =================================================
          VERIFICATION INPUT
          ================================================= */}

      <section className="university-panel verify-input-panel">

        <div className="verify-panel-heading">
          <div className="verify-icon">
            ✓
          </div>

          <div>
            <span className="page-eyebrow">
              CREDENTIAL LOOKUP
            </span>

            <h2>
              Enter Credential ID
            </h2>

            <p>
              The credential ID is the on-chain identifier
              assigned when the credential was issued.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleVerify}
          className="credential-verify-form"
        >
          <div className="credential-id-field">
            <label htmlFor="credential-id">
              Credential ID
            </label>

            <input
              id="credential-id"
              type="number"
              min="1"
              value={credentialId}
              onChange={(event) =>
                setCredentialId(
                  event.target.value,
                )
              }
              placeholder="e.g. 1"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="primary-button verify-submit-button"
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify Credential →"}
          </button>
        </form>

        <div className="verify-method-note">
          <span>●</span>
          Verification uses the Sepolia blockchain
          read-only contract. No wallet signature is
          required.
        </div>

      </section>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <section className="verification-result-error">

          <div className="verification-error-icon">
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
          VERIFICATION RESULT
          ================================================= */}

      {credential && (
        <section className="verification-result">

          {/* =================================================
              RESULT BANNER
              ================================================= */}

          <div
            className={
              signatureValid
                ? "verification-result-banner valid"
                : "verification-result-banner invalid"
            }
          >

            <div className="verification-result-symbol">
              {signatureValid
                ? "✓"
                : "×"}
            </div>

            <div>
              <span>
                VERIFICATION RESULT
              </span>

              <h2>
                {signatureValid
                  ? "Credential Verified"
                  : "Credential Invalid"}
              </h2>

              <p>
                {signatureValid
                  ? "The credential exists on-chain and its cryptographic signature is valid."
                  : "The credential record exists, but its cryptographic signature could not be validated."}
              </p>
            </div>

            <span
              className={`credential-status ${statusClass(
                credential.status,
              )}`}
            >
              <span className="credential-status-dot" />

              {statusText(
                credential.status,
              )}
            </span>

          </div>

          {/* =================================================
              CREDENTIAL INFORMATION
              ================================================= */}

          <div className="verification-result-grid">

            <div className="university-panel verification-info-panel">

              <div className="credential-section-heading">

                <div>
                  <span className="page-eyebrow">
                    CREDENTIAL
                  </span>

                  <h2>
                    Academic Record
                  </h2>
                </div>

                <span className="verification-id">
                  #{credential.id}
                </span>

              </div>

              <div className="credential-info-grid">

                <div className="credential-info-item">
                  <span>
                    Degree
                  </span>

                  <strong>
                    {credential.degree}
                  </strong>
                </div>

                <div className="credential-info-item">
                  <span>
                    Credential Type
                  </span>

                  <strong>
                    {credential.credentialType}
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

              </div>

            </div>

            {/* =================================================
                VERIFICATION CHECKS
                ================================================= */}

            <div className="university-panel verification-checks-panel">

              <div className="credential-section-heading">

                <div>
                  <span className="page-eyebrow">
                    VALIDATION
                  </span>

                  <h2>
                    Verification Checks
                  </h2>
                </div>

              </div>

              <div className="verification-check-list">

                <div className="verification-check">
                  <div className="check-symbol">
                    ✓
                  </div>

                  <div>
                    <strong>
                      Blockchain Record
                    </strong>

                    <span>
                      Credential exists on Sepolia
                    </span>
                  </div>
                </div>

                <div
                  className={
                    signatureValid
                      ? "verification-check"
                      : "verification-check failed"
                  }
                >
                  <div className="check-symbol">
                    {signatureValid
                      ? "✓"
                      : "×"}
                  </div>

                  <div>
                    <strong>
                      Cryptographic Signature
                    </strong>

                    <span>
                      {signatureValid
                        ? "Signature successfully verified"
                        : "Signature verification failed"}
                    </span>
                  </div>
                </div>

                <div
                  className={
                    credential.status === 0
                      ? "verification-check"
                      : "verification-check failed"
                  }
                >
                  <div className="check-symbol">
                    {credential.status === 0
                      ? "✓"
                      : "×"}
                  </div>

                  <div>
                    <strong>
                      Credential Status
                    </strong>

                    <span>
                      {statusText(
                        credential.status,
                      )}
                    </span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* =================================================
              BLOCKCHAIN PROOF
              ================================================= */}

          <div className="university-panel verification-proof-panel">

            <div className="credential-section-heading">

              <div>
                <span className="page-eyebrow">
                  CRYPTOGRAPHIC PROOF
                </span>

                <h2>
                  Blockchain Evidence
                </h2>

                <p>
                  Proof values retrieved directly from
                  the credential record.
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

              <div className="credential-proof-item">
                <span>
                  Issuer Wallet
                </span>

                <code>
                  {shortAddress(
                    credential.issuer,
                  )}
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

          </div>

          {/* =================================================
              ACTIONS
              ================================================= */}

          <div className="verification-bottom-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={handleClear}
            >
              Clear Result
            </button>

            <Link
              to={`/university/credentials/${credential.id}`}
              className="primary-button"
            >
              Open Full Credential →
            </Link>

          </div>

        </section>
      )}
    </UniversityLayout>
  );
}