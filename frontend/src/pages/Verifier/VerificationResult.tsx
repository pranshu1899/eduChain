import { Link } from "react-router-dom";

export interface VerificationCredential {
  id: string | number;
  studentDID?: string;
  credentialType?: string;
  degree?: string;
  institution?: string;
  institutionId?: string;
  issueDate?: string;
  version?: string | number;
  issuer?: string;
  credentialHash?: string;
  signature?: string;
  ipfsCID?: string;
  status?: string;
  issuerAuthorized?: boolean;
  signatureValid?: boolean;
  hashValid?: boolean;
  expired?: boolean;
  revoked?: boolean;
}

interface VerificationResultProps {
  credential: VerificationCredential;
}

function shortValue(value?: string, start = 14, end = 10) {
  if (!value) return "Not available";

  if (value.length <= start + end + 3) {
    return value;
  }

  return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function StatusIcon({ valid }: { valid: boolean }) {
  return (
    <span
      className={`verification-result-icon ${
        valid ? "success" : "danger"
      }`}
    >
      {valid ? "✓" : "×"}
    </span>
  );
}

export default function VerificationResult({
  credential,
}: VerificationResultProps) {
  const revoked =
    credential.revoked === true ||
    credential.status?.toLowerCase() === "revoked";

  const expired =
    credential.expired === true ||
    credential.status?.toLowerCase() === "expired";

  const issuerValid = credential.issuerAuthorized !== false;
  const signatureValid = credential.signatureValid !== false;
  const hashValid = credential.hashValid !== false;

  const verified = !revoked && !expired && issuerValid && signatureValid;

  let resultTitle = "Credential Verified";
  let resultDescription =
    "This credential has been successfully verified against the EduProof blockchain record.";

  if (revoked) {
    resultTitle = "Credential Revoked";
    resultDescription =
      "This credential exists on-chain, but it has been revoked by the authorized issuer.";
  } else if (expired) {
    resultTitle = "Credential Expired";
    resultDescription =
      "This credential was issued by an authorized issuer but is no longer valid.";
  } else if (!issuerValid) {
    resultTitle = "Issuer Not Authorized";
    resultDescription =
      "The credential issuer could not be verified as an authorized EduProof institution.";
  } else if (!signatureValid) {
    resultTitle = "Invalid Signature";
    resultDescription =
      "The credential signature could not be cryptographically verified.";
  }

  return (
    <div className="verification-result-page">
      <div className="verification-result-container">
        {/* HEADER */}
        <div className="verification-result-header">
          <div>
            <div className="verification-result-eyebrow">
              BLOCKCHAIN VERIFICATION
            </div>

            <h1>Verification Result</h1>

            <p>
              Independent verification of credential #{credential.id}
              directly against the EduProof blockchain record.
            </p>
          </div>

          <Link to="/verify" className="verification-back-button">
            ← Verify another
          </Link>
        </div>

        {/* MAIN RESULT */}
        <section
          className={`verification-result-banner ${
            verified ? "verified" : "failed"
          }`}
        >
          <StatusIcon valid={verified} />

          <div className="verification-result-banner-content">
            <div className="verification-result-label">
              VERIFICATION RESULT
            </div>

            <h2>{resultTitle}</h2>

            <p>{resultDescription}</p>
          </div>

          <div
            className={`verification-result-status ${
              verified ? "verified" : "failed"
            }`}
          >
            {verified ? "VALID" : "NOT VALID"}
          </div>
        </section>

        {/* CREDENTIAL SUMMARY */}
        <section className="verification-result-card">
          <div className="verification-result-card-header">
            <div>
              <div className="verification-result-eyebrow">
                CREDENTIAL RECORD
              </div>

              <h2>Academic Credential</h2>
            </div>

            <span
              className={`verification-status-pill ${
                verified ? "active" : "revoked"
              }`}
            >
              <span />
              {revoked
                ? "REVOKED"
                : expired
                ? "EXPIRED"
                : verified
                ? "ACTIVE"
                : "INVALID"}
            </span>
          </div>

          <div className="credential-identity">
            <div className="credential-type">
              {credential.credentialType || "Academic Credential"}
            </div>

            <h3>{credential.degree || "Degree information unavailable"}</h3>

            <p>
              {credential.institution ||
                "Institution information unavailable"}
            </p>
          </div>

          <div className="credential-data-grid">
            <div className="credential-data-item">
              <span>STUDENT DID</span>
              <strong title={credential.studentDID}>
                {shortValue(credential.studentDID)}
              </strong>
            </div>

            <div className="credential-data-item">
              <span>INSTITUTION ID</span>
              <strong>
                {credential.institutionId || "Not available"}
              </strong>
            </div>

            <div className="credential-data-item">
              <span>ISSUE DATE</span>
              <strong>{formatDate(credential.issueDate)}</strong>
            </div>

            <div className="credential-data-item">
              <span>VERSION</span>
              <strong>
                {credential.version
                  ? `v${credential.version}`
                  : "v1"}
              </strong>
            </div>

            <div className="credential-data-item">
              <span>ISSUER</span>
              <strong title={credential.issuer}>
                {shortValue(credential.issuer)}
              </strong>
            </div>

            <div className="credential-data-item">
              <span>NETWORK</span>
              <strong>Ethereum Sepolia</strong>
            </div>
          </div>
        </section>

        {/* VERIFICATION CHECKS */}
        <section className="verification-result-card">
          <div className="verification-result-card-header">
            <div>
              <div className="verification-result-eyebrow">
                VERIFICATION CHECKS
              </div>

              <h2>Why this credential is {verified ? "valid" : "not valid"}</h2>

              <p>
                Each check is independently evaluated against the
                credential's blockchain record.
              </p>
            </div>
          </div>

          <div className="verification-check-list">
            <div className="verification-check">
              <StatusIcon valid={issuerValid} />

              <div>
                <strong>Authorized Issuer</strong>

                <span>
                  {issuerValid
                    ? "The credential was issued by an authorized institution."
                    : "The issuer is not currently authorized."}
                </span>
              </div>

              <b>{issuerValid ? "VALID" : "FAILED"}</b>
            </div>

            <div className="verification-check">
              <StatusIcon valid={signatureValid} />

              <div>
                <strong>Digital Signature</strong>

                <span>
                  {signatureValid
                    ? "The issuer's cryptographic signature is valid."
                    : "The cryptographic signature could not be verified."}
                </span>
              </div>

              <b>{signatureValid ? "VALID" : "FAILED"}</b>
            </div>

            <div className="verification-check">
              <StatusIcon valid={hashValid} />

              <div>
                <strong>Credential Integrity</strong>

                <span>
                  {hashValid
                    ? "The credential data matches its recorded blockchain proof."
                    : "The credential data does not match its recorded hash."}
                </span>
              </div>

              <b>{hashValid ? "MATCH" : "MISMATCH"}</b>
            </div>

            <div className="verification-check">
              <StatusIcon valid={!revoked} />

              <div>
                <strong>Revocation Status</strong>

                <span>
                  {revoked
                    ? "This credential has been revoked on-chain."
                    : "No revocation has been recorded for this credential."}
                </span>
              </div>

              <b>{revoked ? "REVOKED" : "ACTIVE"}</b>
            </div>

            <div className="verification-check">
              <StatusIcon valid={!expired} />

              <div>
                <strong>Validity Period</strong>

                <span>
                  {expired
                    ? "The credential is outside its valid period."
                    : "The credential is currently within its valid period."}
                </span>
              </div>

              <b>{expired ? "EXPIRED" : "VALID"}</b>
            </div>
          </div>
        </section>

        {/* CRYPTOGRAPHIC PROOF */}
        <section className="verification-result-card">
          <div className="verification-result-card-header">
            <div>
              <div className="verification-result-eyebrow">
                BLOCKCHAIN PROOF
              </div>

              <h2>Cryptographic Evidence</h2>

              <p>
                Technical proof associated with this credential.
              </p>
            </div>
          </div>

          <div className="proof-grid">
            <div className="proof-item">
              <span>CREDENTIAL HASH</span>

              <code title={credential.credentialHash}>
                {credential.credentialHash || "Not available"}
              </code>
            </div>

            <div className="proof-item">
              <span>ISSUER SIGNATURE</span>

              <code title={credential.signature}>
                {credential.signature || "Not available"}
              </code>
            </div>

            <div className="proof-item">
              <span>IPFS CID</span>

              <code title={credential.ipfsCID}>
                {credential.ipfsCID || "Not available"}
              </code>
            </div>

            <div className="proof-item">
              <span>BLOCKCHAIN NETWORK</span>

              <code>Ethereum Sepolia</code>
            </div>
          </div>
        </section>

        {/* FINAL MESSAGE */}
        <section
          className={`verification-final-message ${
            verified ? "success" : "warning"
          }`}
        >
          <div className="verification-final-icon">
            {verified ? "✓" : "!"}
          </div>

          <div>
            <strong>
              {verified
                ? "Blockchain verification completed successfully."
                : "Blockchain verification detected an issue."}
            </strong>

            <p>
              {verified
                ? "The credential can be trusted according to the current EduProof on-chain record."
                : "The result should not be treated as proof of a currently valid credential."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}