import { Link } from "react-router-dom";

import UniversityLayout from "../../components/university/UniversityLayout";
import UniversityStats from "../../components/university/UniversityStats";

export default function UniversityDashboard() {
  return (
    <UniversityLayout>

      {/* PAGE HEADER */}

      <section className="university-page-header">

        <div>

          <span className="page-eyebrow">
            UNIVERSITY OVERVIEW
          </span>

          <h1>
            University Dashboard
          </h1>

          <p>
            Manage academic credentials, monitor issuance
            activity and verify blockchain records.
          </p>

        </div>

        <div className="university-page-actions">

          <Link
            to="/university/verify"
            className="secondary-button"
          >
            Verify Credential
          </Link>

          <Link
            to="/university/issue"
            className="primary-button"
          >
            + Issue Credential
          </Link>

        </div>

      </section>


      {/* STATISTICS */}

      <UniversityStats
        total={0}
        active={0}
        superseded={0}
        revoked={0}
      />


      {/* LOWER DASHBOARD */}

      <section className="university-dashboard-grid">

        <div className="university-panel">

          <div className="university-panel-header">

            <div>
              <h2>
                Recent Credentials
              </h2>

              <p>
                Credentials issued by your institution.
              </p>
            </div>

            <Link
              to="/university/credentials"
              className="panel-link"
            >
              View all →
            </Link>

          </div>


          <div className="university-empty-state">

            <div className="empty-state-icon">
              ▣
            </div>

            <h3>
              No credentials loaded
            </h3>

            <p>
              Blockchain credentials will appear here
              once the university wallet is connected.
            </p>

            <Link
              to="/university/issue"
              className="secondary-button"
            >
              Issue Credential
            </Link>

          </div>

        </div>


        <div className="university-panel">

          <div className="university-panel-header">

            <div>
              <h2>
                Quick Actions
              </h2>

              <p>
                Common university operations.
              </p>
            </div>

          </div>


          <Link
            to="/university/issue"
            className="university-action-card"
          >
            <div className="action-icon purple">
              +
            </div>

            <div>
              <strong>
                Issue Credential
              </strong>

              <span>
                Create a new academic credential
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>


          <Link
            to="/university/credentials"
            className="university-action-card"
          >
            <div className="action-icon blue">
              ▣
            </div>

            <div>
              <strong>
                Manage Credentials
              </strong>

              <span>
                View and manage issued records
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>


          <Link
            to="/university/verify"
            className="university-action-card"
          >
            <div className="action-icon green">
              ✓
            </div>

            <div>
              <strong>
                Verify Credential
              </strong>

              <span>
                Validate an existing credential
              </span>
            </div>

            <span className="action-arrow">
              →
            </span>
          </Link>

        </div>

      </section>

    </UniversityLayout>
  );
}