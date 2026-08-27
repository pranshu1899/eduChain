import { Link } from "react-router-dom";

export default function VerifierDashboard() {
  return (
    <div className="page">
      <section className="student-page-header">
        <div>
          <span className="student-page-eyebrow">
            PUBLIC VERIFIER
          </span>

          <h1>
            Verification Dashboard
          </h1>

          <p>
            Independently verify EduProof
            credentials and blockchain evidence.
          </p>
        </div>
      </section>

      <section className="student-credential-grid">
        <Link
          to="/verify"
          className="student-credential-card"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h3>Verify Credential</h3>

          <p>
            Check a credential directly against
            the Sepolia blockchain.
          </p>
        </Link>
      </section>
    </div>
  );
}