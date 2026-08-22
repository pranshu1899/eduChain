import { useState } from "react";
import { Link } from "react-router-dom";
import UniversityLayout from "../../components/university/UniversityLayout";

export default function IssueCredential() {
  const [studentDID, setStudentDID] = useState("");
  const [credentialType, setCredentialType] = useState("B.Tech");
  const [institution, setInstitution] =
    useState("ABC University");
  const [institutionId, setInstitutionId] =
    useState("ABC-001");
  const [degree, setDegree] =
    useState("Bachelor of Technology");
  const [issueDate, setIssueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /*
   * These values will be supplied by the connected
   * university wallet/backend integration.
   *
   * Keeping them here prevents the UI from inventing
   * blockchain state.
   */
  const walletAddress = "Not connected";
  const connected = false;

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!studentDID.trim()) {
      setError("Please enter the student's DID.");
      return;
    }

    if (!degree.trim()) {
      setError("Please enter the degree.");
      return;
    }

    if (!issueDate) {
      setError("Please select the issue date.");
      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       *
       * This is the integration point for the existing
       * EduProof backend / smart-contract issuance flow.
       *
       * The backend flow you already built is:
       *
       * 1. Create credential metadata
       * 2. createCredentialHash()
       * 3. University signs the hash
       * 4. Create Verifiable Credential
       * 5. Upload VC metadata to IPFS
       * 6. Call EduProof.issueCredential()
       *
       * Do not put the Pinata JWT in this frontend.
       *
       * We are intentionally not fabricating an API endpoint
       * here because your actual backend endpoint has not
       * been provided in this conversation.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 600),
      );

      setMessage(
        "Credential data validated. Blockchain issuance integration is ready to be connected.",
      );
    } catch (err) {
      console.error(err);

      setError(
        "Credential issuance failed. Please check the wallet and backend connection.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <UniversityLayout
      walletAddress={walletAddress}
      connected={connected}
    >
      <section className="university-page-header">
        <div>
          <span className="page-eyebrow">
            CREDENTIAL MANAGEMENT
          </span>

          <h1>Issue Credential</h1>

          <p>
            Create a verifiable academic credential secured
            by the EduProof blockchain network.
          </p>
        </div>

        <div className="university-page-actions">
          <Link
            to="/university"
            className="secondary-button"
          >
            ← Dashboard
          </Link>

          <Link
            to="/university/credentials"
            className="secondary-button"
          >
            View Credentials
          </Link>
        </div>
      </section>

      <section className="university-dashboard-grid issue-page-grid">
        {/* ==========================================
            FORM
           ========================================== */}

        <div className="university-panel">
          <div className="university-panel-header">
            <div>
              <h2>Credential Information</h2>

              <p>
                Enter the academic details that will become
                part of the credential.
              </p>
            </div>
          </div>

          <form
            className="credential-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">
              <div className="form-field form-field-full">
                <label htmlFor="studentDID">
                  Student DID
                </label>

                <input
                  id="studentDID"
                  type="text"
                  value={studentDID}
                  onChange={(event) =>
                    setStudentDID(event.target.value)
                  }
                  placeholder="did:eduproof:..."
                  required
                />

                <span className="form-help">
                  Decentralized identifier of the student.
                </span>
              </div>

              <div className="form-field">
                <label htmlFor="credentialType">
                  Credential Type
                </label>

                <select
                  id="credentialType"
                  value={credentialType}
                  onChange={(event) =>
                    setCredentialType(event.target.value)
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

              <div className="form-field">
                <label htmlFor="degree">
                  Degree
                </label>

                <input
                  id="degree"
                  type="text"
                  value={degree}
                  onChange={(event) =>
                    setDegree(event.target.value)
                  }
                  placeholder="Bachelor of Technology"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="institution">
                  Institution
                </label>

                <input
                  id="institution"
                  type="text"
                  value={institution}
                  onChange={(event) =>
                    setInstitution(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="institutionId">
                  Institution ID
                </label>

                <input
                  id="institutionId"
                  type="text"
                  value={institutionId}
                  onChange={(event) =>
                    setInstitutionId(event.target.value)
                  }
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="issueDate">
                  Issue Date
                </label>

                <input
                  id="issueDate"
                  type="date"
                  value={issueDate}
                  onChange={(event) =>
                    setIssueDate(event.target.value)
                  }
                  required
                />
              </div>
            </div>

            {error && (
              <div className="form-message error">
                {error}
              </div>
            )}

            {message && (
              <div className="form-message success">
                {message}
              </div>
            )}

            <div className="form-actions">
              <Link
                to="/university"
                className="secondary-button"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading
                  ? "Preparing Credential..."
                  : "Issue Credential →"}
              </button>
            </div>
          </form>
        </div>

        {/* ==========================================
            PREVIEW / BLOCKCHAIN FLOW
           ========================================== */}

        <div className="university-panel">
          <div className="university-panel-header">
            <div>
              <h2>Credential Preview</h2>

              <p>
                Review the information before issuing.
              </p>
            </div>
          </div>

          <div className="credential-preview">
            <div className="preview-badge">
              EDUPROOF CREDENTIAL
            </div>

            <h3>
              {degree || "Academic Credential"}
            </h3>

            <div className="preview-row">
              <span>Credential Type</span>

              <strong>
                {credentialType}
              </strong>
            </div>

            <div className="preview-row">
              <span>Institution</span>

              <strong>
                {institution}
              </strong>
            </div>

            <div className="preview-row">
              <span>Institution ID</span>

              <strong>
                {institutionId}
              </strong>
            </div>

            <div className="preview-row">
              <span>Student DID</span>

              <strong className="break-text">
                {studentDID || "Not provided"}
              </strong>
            </div>

            <div className="preview-row">
              <span>Issue Date</span>

              <strong>
                {issueDate || "Not selected"}
              </strong>
            </div>
          </div>

          <div className="issuance-flow">
            <div className="flow-title">
              BLOCKCHAIN ISSUANCE FLOW
            </div>

            <div className="flow-step">
              <span>01</span>
              <div>
                <strong>
                  Credential Metadata
                </strong>

                <small>
                  Academic information is prepared.
                </small>
              </div>
            </div>

            <div className="flow-step">
              <span>02</span>
              <div>
                <strong>
                  Cryptographic Hash
                </strong>

                <small>
                  Credential data is hashed.
                </small>
              </div>
            </div>

            <div className="flow-step">
              <span>03</span>
              <div>
                <strong>
                  University Signature
                </strong>

                <small>
                  Issuer wallet signs the credential hash.
                </small>
              </div>
            </div>

            <div className="flow-step">
              <span>04</span>
              <div>
                <strong>
                  IPFS Metadata
                </strong>

                <small>
                  Verifiable Credential metadata is stored
                  off-chain.
                </small>
              </div>
            </div>

            <div className="flow-step">
              <span>05</span>
              <div>
                <strong>
                  Blockchain Record
                </strong>

                <small>
                  Credential proof is recorded on Sepolia.
                </small>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UniversityLayout>
  );
}