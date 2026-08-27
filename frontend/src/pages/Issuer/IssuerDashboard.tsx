import { Link } from "react-router-dom";

export default function IssuerDashboard() {
  return (
    <div className="page">
      <section className="student-page-header">
        <div>
          <span className="student-page-eyebrow">
            ISSUER PORTAL
          </span>

          <h1>Issuer Dashboard</h1>

          <p>
            Manage credentials and institution-backed
            academic records.
          </p>
        </div>
      </section>

      <section className="student-credential-grid">
        <Link
          to="/issuer/credentials"
          className="student-credential-card"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h3>Credentials</h3>

          <p>
            View credentials issued by this institution.
          </p>
        </Link>

        <Link
          to="/issuer/issue"
          className="student-credential-card"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <h3>Issue Credential</h3>

          <p>
            Create and issue a new verifiable credential.
          </p>
        </Link>
      </section>
    </div>
  );
}