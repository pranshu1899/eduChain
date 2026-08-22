import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import "./App.css";

import UniversityDashboard from "./pages/University/UniversityDashboard";
import IssueCredential from "./pages/University/IssueCredential";
import UniversityCredentials from "./pages/University/UniversityCredentials";
import UniversityCredentialDetails from "./pages/University/UniversityCredentialDetails";
import UniversityVerify from "./pages/University/UniversityVerify";
import UniversityRevokeCredential from "./pages/University/UniversityRevokeCredential";
import UniversityAnalytics from "./pages/University/UniversityAnalytics";

/* =====================================================
   LANDING PAGE
   ===================================================== */

function LandingPage() {
  return (
    <div className="landing-page">

      <header className="landing-header">
        <div className="brand">

          <div className="brand-mark">
            E
          </div>

          <div>
            <div className="brand-name">
              EduProof
            </div>

            <div className="brand-subtitle">
              Decentralized Academic Credentials
            </div>
          </div>

        </div>
      </header>

      <main className="landing-main">

        <div className="landing-eyebrow">
          EDUPROOF PLATFORM
        </div>

        <h1>
          Choose your <span>EduProof</span> role
        </h1>

        <p className="landing-description">
          Select the interface that matches what you
          want to do. Each role has its own focused
          workspace.
        </p>

        <div className="role-grid">

          {/* UNIVERSITY */}

          <Link
            to="/university"
            className="role-card university"
          >
            <div className="role-icon">
              🏛️
            </div>

            <div className="role-label">
              ISSUER
            </div>

            <h2>
              University
            </h2>

            <p>
              Issue, manage, update and verify academic
              credentials on the blockchain.
            </p>

            <div className="role-action">
              Enter University Portal
              <span>→</span>
            </div>
          </Link>

          {/* STUDENT */}

          <Link
            to="/student"
            className="role-card student"
          >
            <div className="role-icon">
              🎓
            </div>

            <div className="role-label">
              CREDENTIAL OWNER
            </div>

            <h2>
              Student
            </h2>

            <p>
              View your credentials, versions, status
              and blockchain proof.
            </p>

            <div className="role-action">
              Enter Student Portal
              <span>→</span>
            </div>
          </Link>

          {/* VERIFIER */}

          <Link
            to="/verify"
            className="role-card verifier"
          >
            <div className="role-icon">
              🔍
            </div>

            <div className="role-label">
              PUBLIC VERIFIER
            </div>

            <h2>
              Verifier
            </h2>

            <p>
              Verify academic credentials without
              needing a university wallet.
            </p>

            <div className="role-action">
              Open Verification Center
              <span>→</span>
            </div>
          </Link>

        </div>
      </main>
    </div>
  );
}

/* =====================================================
   STUDENT PLACEHOLDER
   ===================================================== */

function StudentPage() {
  return (
    <div className="placeholder-page">

      <div className="placeholder-card">

        <div className="placeholder-icon">
          🎓
        </div>

        <div className="landing-eyebrow">
          STUDENT PORTAL
        </div>

        <h1>
          Student Dashboard
        </h1>

        <p>
          Student workspace will be built here.
        </p>

        <Link
          to="/"
          className="back-link"
        >
          ← Back to role selection
        </Link>

      </div>

    </div>
  );
}

/* =====================================================
   PUBLIC VERIFIER PLACEHOLDER
   ===================================================== */

function VerifierPage() {
  return (
    <div className="placeholder-page">

      <div className="placeholder-card">

        <div className="placeholder-icon">
          🔍
        </div>

        <div className="landing-eyebrow">
          VERIFICATION CENTER
        </div>

        <h1>
          Verify Credential
        </h1>

        <p>
          Public verification workspace will be
          built here.
        </p>

        <Link
          to="/"
          className="back-link"
        >
          ← Back to role selection
        </Link>

      </div>

    </div>
  );
}

/* =====================================================
   APP ROUTER
   ===================================================== */

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =================================================
            LANDING
            ================================================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* =================================================
            UNIVERSITY DASHBOARD
            ================================================= */}

        <Route
          path="/university"
          element={<UniversityDashboard />}
        />

        {/* =================================================
            ISSUE CREDENTIAL
            ================================================= */}

        <Route
          path="/university/issue"
          element={<IssueCredential />}
        />

        {/* =================================================
            UNIVERSITY CREDENTIALS
            ================================================= */}

        <Route
          path="/university/credentials"
          element={<UniversityCredentials />}
        />

        {/* =================================================
            CREDENTIAL DETAILS
            ================================================= */}

        <Route
          path="/university/credentials/:id"
          element={
            <UniversityCredentialDetails />
          }
        />

        {/* =================================================
            VERIFY CREDENTIAL
            ================================================= */}

        <Route
          path="/university/verify"
          element={<UniversityVerify />}
        />

        {/* =================================================
            REVOKE CREDENTIAL
            ================================================= */}

        <Route
          path="/university/revoke"
          element={
            <UniversityRevokeCredential />
          }
        />

        {/* =================================================
            UNIVERSITY ANALYTICS
            ================================================= */}

        <Route
          path="/university/analytics"
          element={<UniversityAnalytics />}
        />

        {/* =================================================
            UNIVERSITY FALLBACK
            ================================================= */}

        <Route
          path="/university/*"
          element={<UniversityDashboard />}
        />

        {/* =================================================
            STUDENT
            ================================================= */}

        <Route
          path="/student/*"
          element={<StudentPage />}
        />

        {/* =================================================
            PUBLIC VERIFIER
            ================================================= */}

        <Route
          path="/verify/*"
          element={<VerifierPage />}
        />

        {/* =================================================
            UNKNOWN ROUTES
            ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;