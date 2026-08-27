import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import "./App.css";

/* =====================================================
   UNIVERSITY
   ===================================================== */

import UniversityDashboard from "./pages/University/UniversityDashboard";
import IssueCredential from "./pages/University/IssueCredential";
import UniversityCredentials from "./pages/University/UniversityCredentials";
import UniversityCredentialDetails from "./pages/University/UniversityCredentialDetails";
import UniversityVerify from "./pages/University/UniversityVerify";
import UniversityRevokeCredential from "./pages/University/UniversityRevokeCredential";
import UniversityAnalytics from "./pages/University/UniversityAnalytics";

/* =====================================================
   STUDENT
   ===================================================== */

import StudentDashboard from "./pages/Student/StudentDashboard";
import StudentCredentialDetails from "./pages/Student/StudentCredentialDetails";
import StudentEvidence from "./pages/Student/StudentEvidence";

/* =====================================================
   EVIDENCE
   ===================================================== */

import EvidenceTest from "./pages/Student/EvidenceTest";

/* =====================================================
   ACHIEVEMENTS
   ===================================================== */

import StudentAchievements from "./pages/Student/StudentAchievements";
import StudentAchievementCreate from "./pages/Student/StudentAchievementCreate";
import StudentAchievementDetails from "./pages/Student/StudentAchievementDetails";

/* =====================================================
   PUBLIC VERIFIER
   ===================================================== */

import VerifierPage from "./pages/Verifier/VerifierPage";

/* =====================================================
   ISSUER APPLICATION
   ===================================================== */

import RequestIssuer from "./pages/RequestIssuer";

/* =====================================================
   HACKATHON ORGANIZATION APPLICATION
   ===================================================== */

import RequestHackathon from "./pages/RequestHackathon/RequestHackathon";

/* =====================================================
   HACKATHON ORGANIZATION PORTAL
   ===================================================== */

import HackathonDashboard from "./pages/Hackathon/HackathonDashboard";
import HackathonCreateEvent from "./pages/Hackathon/HackathonCreateEvent";
import HackathonParticipants from "./pages/Hackathon/HackathonParticipants";

/* =====================================================
   ADMIN
   ===================================================== */

import AdminDashboard from "./pages/Admin/AdminDashboard";

/* =====================================================
   LANDING PAGE
   ===================================================== */

function LandingPage() {
  return (
    <div className="landing-page">
      {/* =================================================
          HEADER
          ================================================= */}

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

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="landing-main">
        <div className="landing-eyebrow">
          EDUPROOF PLATFORM
        </div>

        <h1>
          Choose your{" "}
          <span>
            EduProof
          </span>{" "}
          role
        </h1>

        <p className="landing-description">
          Select the interface that matches
          what you want to do. Each role has
          its own focused workspace.
        </p>

        <div className="role-grid">
          {/* =================================================
              UNIVERSITY
              ================================================= */}

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
              Issue, manage, update and verify
              academic credentials on the
              blockchain.
            </p>

            <div className="role-action">
              Enter University Portal
              <span>
                →
              </span>
            </div>
          </Link>

          {/* =================================================
              STUDENT
              ================================================= */}

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
              View your credentials, evidence,
              achievements and blockchain proof.
            </p>

            <div className="role-action">
              Enter Student Portal
              <span>
                →
              </span>
            </div>
          </Link>

          {/* =================================================
              VERIFIER
              ================================================= */}

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
              Verify academic credentials
              without needing a university
              wallet.
            </p>

            <div className="role-action">
              Open Verification Center
              <span>
                →
              </span>
            </div>
          </Link>

          {/* =================================================
              UNIVERSITY ISSUER APPLICATION
              ================================================= */}

          <Link
            to="/request-issuer"
            className="role-card university"
          >
            <div className="role-icon">
              📝
            </div>

            <div className="role-label">
              ISSUER APPLICATION
            </div>

            <h2>
              Become an Issuer
            </h2>

            <p>
              Apply for university issuer
              authorization. Approval is required
              before credentials can be issued.
            </p>

            <div className="role-action">
              Apply for Authorization
              <span>
                →
              </span>
            </div>
          </Link>

          {/* =================================================
              HACKATHON ORGANIZATION APPLICATION
              ================================================= */}

          <Link
            to="/request-hackathon"
            className="role-card student"
          >
            <div className="role-icon">
              🏆
            </div>

            <div className="role-label">
              HACKATHON NETWORK
            </div>

            <h2>
              Become a Hackathon Organization
            </h2>

            <p>
              Apply to issue batch-verified
              hackathon certificates using
              EduProof's cryptographic
              infrastructure.
            </p>

            <div className="role-action">
              Apply for Authorization
              <span>
                →
              </span>
            </div>
          </Link>

          {/* =================================================
              ADMIN
              ================================================= */}

          <Link
            to="/admin"
            className="role-card verifier"
          >
            <div className="role-icon">
              🛡️
            </div>

            <div className="role-label">
              PLATFORM AUTHORITY
            </div>

            <h2>
              Admin
            </h2>

            <p>
              Review issuer and hackathon
              organization applications and
              authorize trusted institutions.
            </p>

            <div className="role-action">
              Open Admin Portal
              <span>
                →
              </span>
            </div>
          </Link>
        </div>
      </main>
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
          element={
            <LandingPage />
          }
        />

        {/* =================================================
            UNIVERSITY ISSUER APPLICATION
            ================================================= */}

        <Route
          path="/request-issuer"
          element={
            <RequestIssuer />
          }
        />

        {/* =================================================
            HACKATHON ORGANIZATION APPLICATION
            ================================================= */}

        <Route
          path="/request-hackathon"
          element={
            <RequestHackathon />
          }
        />

        {/* =================================================
            ADMIN
            ================================================= */}

        <Route
          path="/admin"
          element={
            <AdminDashboard />
          }
        />

        {/* =================================================
            UNIVERSITY
            ================================================= */}

        <Route
          path="/university"
          element={
            <UniversityDashboard />
          }
        />

        <Route
          path="/university/issue"
          element={
            <IssueCredential />
          }
        />

        <Route
          path="/university/credentials"
          element={
            <UniversityCredentials />
          }
        />

        <Route
          path="/university/credentials/:id"
          element={
            <UniversityCredentialDetails />
          }
        />

        <Route
          path="/university/verify"
          element={
            <UniversityVerify />
          }
        />

        <Route
          path="/university/revoke/:id"
          element={
            <UniversityRevokeCredential />
          }
        />

        <Route
          path="/university/analytics"
          element={
            <UniversityAnalytics />
          }
        />

        <Route
          path="/university/*"
          element={
            <UniversityDashboard />
          }
        />

        {/* =================================================
            STUDENT
            ================================================= */}

        <Route
          path="/student"
          element={
            <StudentDashboard />
          }
        />

        <Route
          path="/student/credentials"
          element={
            <StudentDashboard />
          }
        />

        <Route
          path="/student/credentials/:id"
          element={
            <StudentCredentialDetails />
          }
        />

        {/* =================================================
            MY EVIDENCE
            ================================================= */}

        <Route
          path="/student/evidence"
          element={
            <StudentEvidence />
          }
        />

        {/* =================================================
            EVIDENCE CREATION
            ================================================= */}

        <Route
          path="/student/evidence-test"
          element={
            <EvidenceTest />
          }
        />

        {/* =================================================
            ACHIEVEMENTS
            ================================================= */}

        <Route
          path="/student/achievements"
          element={
            <StudentAchievements />
          }
        />

        <Route
          path="/student/achievements/create"
          element={
            <StudentAchievementCreate />
          }
        />

        <Route
          path="/student/achievements/:id"
          element={
            <StudentAchievementDetails />
          }
        />

        {/* =================================================
            STUDENT FALLBACK
            ================================================= */}

        <Route
          path="/student/*"
          element={
            <StudentDashboard />
          }
        />

        {/* =================================================
            HACKATHON ORGANIZATION PORTAL
            ================================================= */}

        <Route
          path="/hackathon"
          element={
            <HackathonDashboard />
          }
        />

        <Route
          path="/hackathon/create"
          element={
            <HackathonCreateEvent />
          }
        />

        <Route
          path="/hackathon/:id/participants"
          element={
            <HackathonParticipants />
          }
        />

        {/* =================================================
            PUBLIC VERIFIER
            ================================================= */}

        <Route
          path="/verify"
          element={
            <VerifierPage />
          }
        />

        <Route
          path="/verify/:id"
          element={
            <VerifierPage />
          }
        />

        <Route
          path="/verify/*"
          element={
            <VerifierPage />
          }
        />

        {/* =================================================
            UNKNOWN ROUTE
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