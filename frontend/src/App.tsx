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
   VERIFIER
   ===================================================== */

import VerifierPage from "./pages/Verifier/VerifierPage";

/* =====================================================
   ISSUER APPLICATION
   ===================================================== */

import RequestIssuer from "./pages/RequestIssuer";

/* =====================================================
   HACKATHON APPLICATION
   ===================================================== */

import RequestHackathon from "./pages/RequestHackathon/RequestHackathon";

/* =====================================================
   HACKATHON PORTAL
   ===================================================== */

import HackathonDashboard from "./pages/Hackathon/HackathonDashboard";
import HackathonCreateEvent from "./pages/Hackathon/HackathonCreateEvent";
import HackathonParticipants from "./pages/Hackathon/HackathonParticipants";
import HackathonCertificates from "./pages/Hackathon/HackathonCertificates";
import HackathonGuard from "./pages/Hackathon/HackathonGuard";

/* =====================================================
   ADMIN
   ===================================================== */

import AdminDashboard from "./pages/Admin/AdminDashboard";

/* =====================================================
   LANDING PAGE
   ===================================================== */

function LandingPage() {
  return (
    <div className="landing-page" style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column" }}>
      {/* HEADER */}
      <header style={{ padding: "24px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", background: "rgba(5, 10, 20, 0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="dashboard-brand" style={{ marginBottom: 0 }}>
          <div className="dashboard-brand-mark">E</div>
          <div>
            <div className="dashboard-brand-name">EduProof</div>
            <div className="dashboard-brand-subtitle">Verifiable. Trusted. On-Chain.</div>
          </div>
        </div>
        <div>
          <div className="dashboard-badge success">Sepolia Network</div>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 24px" }}>
        
        {/* HERO */}
        <section style={{ textAlign: "center", maxWidth: "800px", marginBottom: "80px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "20px", background: "rgba(52, 211, 153, 0.1)", color: "var(--primary)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "24px", border: "1px solid var(--primary-light)" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 8px var(--primary)" }}></span>
            DECENTRALIZED ACADEMIC INFRASTRUCTURE
          </div>
          
          <h1 style={{ fontSize: "56px", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 24px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Verifiable. Trusted. <span style={{ color: "var(--primary)" }}>On-Chain.</span>
          </h1>
          
          <p style={{ fontSize: "18px", color: "var(--text-soft)", margin: 0, lineHeight: 1.6, maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
            EduProof provides cryptographically secure, privacy-preserving infrastructure for issuing, storing, and verifying academic credentials and hackathon certificates on the Ethereum blockchain.
          </p>
        </section>

        {/* ROLE SELECTION */}
        <section style={{ width: "100%", maxWidth: "1200px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "32px" }}>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "24px", margin: "0 0 8px" }}>Select Workspace</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>Choose your role to access the appropriate dashboard and tools.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "24px" }}>
            
            {/* STUDENT */}
            <Link to="/student" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--secondary)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.1)", color: "var(--secondary)", display: "grid", placeItems: "center", fontSize: "24px" }}>🎓</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>CREDENTIAL OWNER</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>Student</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Access your personal credential wallet. View achievements, upload evidence, and share cryptographically secure proofs.
              </p>
              <div style={{ color: "var(--secondary)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Enter Student Portal →
              </div>
            </Link>

            {/* UNIVERSITY */}
            <Link to="/university" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--primary)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(52, 211, 153, 0.1)", color: "var(--primary)", display: "grid", placeItems: "center", fontSize: "24px" }}>🏛️</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>AUTHORIZED ISSUER</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>University</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Institutional software to issue, manage, and revoke academic credentials on the blockchain.
              </p>
              <div style={{ color: "var(--primary)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Enter University Portal →
              </div>
            </Link>

            {/* VERIFIER */}
            <Link to="/verify" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--accent)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.1)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: "24px" }}>🛡️</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>PUBLIC VERIFIER</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>Verification Center</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Cryptographically verify the authenticity and integrity of any academic credential using its on-chain proof.
              </p>
              <div style={{ color: "var(--accent)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Open Verification Center →
              </div>
            </Link>

            {/* HACKATHON */}
            <Link to="/hackathon" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--cyan)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(6, 182, 212, 0.1)", color: "var(--cyan)", display: "grid", placeItems: "center", fontSize: "24px" }}>🏆</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>EVENT MANAGEMENT</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>Hackathon Organization</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Manage events, participants, and issue batch-verified certificates secured by a Merkle root.
              </p>
              <div style={{ color: "var(--cyan)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Open Hackathon Portal →
              </div>
            </Link>

            {/* ADMIN */}
            <Link to="/admin" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--pending)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.1)", color: "var(--pending)", display: "grid", placeItems: "center", fontSize: "24px" }}>⚙️</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>PLATFORM AUTHORITY</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>Platform Admin</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Review and approve applications for new University Issuers and Hackathon Organizations.
              </p>
              <div style={{ color: "var(--pending)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Open Admin Portal →
              </div>
            </Link>

            {/* APPLY ISSUER */}
            <Link to="/request-issuer" className="dashboard-card" style={{ textDecoration: "none", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "var(--text-muted)" }}></div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-soft)", display: "grid", placeItems: "center", fontSize: "24px" }}>📝</div>
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", marginBottom: "2px" }}>REGISTRATION</div>
                  <h3 style={{ margin: 0, fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif", color: "var(--text)" }}>Become an Issuer</h3>
                </div>
              </div>
              <p style={{ color: "var(--text-soft)", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px", flex: 1 }}>
                Apply for authorization to become a trusted university issuer on the EduProof network.
              </p>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                Apply for Authorization →
              </div>
            </Link>

          </div>
        </section>
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
            UNIVERSITY APPLICATION
            ================================================= */}

        <Route
          path="/request-issuer"
          element={
            <RequestIssuer />
          }
        />

        {/* =================================================
            HACKATHON APPLICATION
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

        <Route
          path="/student/evidence"
          element={
            <StudentEvidence />
          }
        />

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
            <HackathonGuard>
              <HackathonDashboard />
            </HackathonGuard>
          }
        />

        <Route
          path="/hackathon/create"
          element={
            <HackathonGuard>
              <HackathonCreateEvent />
            </HackathonGuard>
          }
        />

        <Route
          path="/hackathon/:id/participants"
          element={
            <HackathonGuard>
              <HackathonParticipants />
            </HackathonGuard>
          }
        />

        <Route
          path="/hackathon/:id/certificates"
          element={
            <HackathonGuard>
              <HackathonCertificates />
            </HackathonGuard>
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
            UNKNOWN
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