import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  BrowserProvider,
} from "ethers";

import {
  getHackathons,
  getHackathonParticipants,
  getHackathonBatches,
} from "../../services/hackathonService";

import {
  getHackathonOrganizationOnChain,
} from "../../services/hackathonAccessService";

import type {
  HackathonEvent,
} from "../../types/hackathon";

import HackathonLayout from "./HackathonLayout";

export default function HackathonDashboard() {


  const [
    hackathons,
    setHackathons,
  ] = useState<HackathonEvent[]>(
    [],
  );

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      if (
        typeof window ===
          "undefined" ||
        !window.ethereum
      ) {
        throw new Error(
          "MetaMask is required to access the Hackathon Organization Portal.",
        );
      }

      const provider =
        new BrowserProvider(
          window.ethereum,
        );

      const signer =
        await provider.getSigner();

      const address =
        await signer.getAddress();



      const onChainOrg =
        await getHackathonOrganizationOnChain(
          address,
        );

      if (!onChainOrg || onChainOrg.status === 0) {
        throw new Error(
          "No hackathon organization application exists for this wallet.",
        );
      }

      if (
        onChainOrg.status !== 2
      ) {
        const statusStr = onChainOrg.status === 1 ? "PENDING" : onChainOrg.status === 3 ? "REJECTED" : onChainOrg.status === 4 ? "REVOKED" : "UNKNOWN";
        throw new Error(
          `Organization access is ${statusStr.toLowerCase()}. Admin approval is required.`,
        );
      }

      setOrganizationName(
        onChainOrg.organizationName,
      );

      const organizationHackathons =
        getHackathons().filter(
          (hackathon) =>
            hackathon.organizationWallet.toLowerCase() ===
            address.toLowerCase(),
        );

      setHackathons(
        organizationHackathons,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load hackathon portal.",
      );
    } finally {
      setLoading(false);
    }
  }

  const totalParticipants =
    hackathons.reduce(
      (total, hackathon) =>
        total +
        getHackathonParticipants(
          hackathon.id,
        ).length,
      0,
    );

  const totalBatches =
    hackathons.reduce(
      (total, hackathon) =>
        total +
        getHackathonBatches().filter(
          (batch) =>
            batch.hackathonId ===
            hackathon.id,
        ).length,
      0,
    );

  if (loading) {
    return (
      <HackathonLayout>
        <div className="student-main-content">
          <p>
            Loading organization portal...
          </p>
        </div>
      </HackathonLayout>
    );
  }

  if (error) {
    return (
      <HackathonLayout>
        <div className="student-main-content">
          <div
            className="dashboard-card"
            style={{
              maxWidth: "720px",
              margin: "3rem auto",
            }}
          >
            <p
              style={{
                opacity: 0.55,
                fontSize: "0.75rem",
                letterSpacing: "0.12em",
              }}
            >
              ACCESS CONTROL
            </p>

            <h1>
              Hackathon Portal
            </h1>

            <p>
              {error}
            </p>

            <Link to="/request-hackathon">
              Apply for Hackathon Organization
            </Link>
          </div>
        </div>
      </HackathonLayout>
    );
  }

  return (
    <HackathonLayout>
      <div className="student-main-content">

        {/* HEADER */}

        <section className="dashboard-page-header">
          <div>
            <div className="dashboard-eyebrow">HACKATHON ORGANIZATION</div>
            <h1>{organizationName}</h1>
            <p>
              Create hackathons, register students, and issue cryptographically verifiable certificates.
            </p>
          </div>
          <div>
            <Link to="/hackathon/create" className="dashboard-btn-primary" style={{ textDecoration: "none" }}>
              + Create Hackathon
            </Link>
          </div>
        </section>

        {/* OVERVIEW STATS */}

        <section style={{ marginBottom: "48px" }}>
          <div style={{ marginBottom: "16px" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>Overview</h2>
            <p style={{ margin: 0, color: "rgba(245,247,255,0.4)", fontSize: "13px" }}>Your hackathon network at a glance.</p>
          </div>

          <div className="dashboard-stat-grid">
            <div className="dashboard-stat-card violet">
              <span>HACKATHONS</span>
              <strong>{hackathons.length}</strong>
              <p>Total events</p>
            </div>

            <div className="dashboard-stat-card teal">
              <span>PARTICIPANTS</span>
              <strong>{totalParticipants}</strong>
              <p>Total registered</p>
            </div>

            <div className="dashboard-stat-card amber">
              <span>CERT BATCHES</span>
              <strong>{totalBatches}</strong>
              <p>Merkle roots</p>
            </div>
          </div>
        </section>

        {/* EVENTS */}

        <section>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "24px", margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>My Hackathons</h2>
            <p style={{ margin: 0, color: "rgba(245,247,255,0.4)", fontSize: "13px" }}>Manage your existing hackathon events and their certificate lifecycle.</p>
          </div>

          {hackathons.length === 0 ? (
            <div className="dashboard-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>📅</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontFamily: "'Space Grotesk', sans-serif" }}>No hackathons yet</h3>
              <p style={{ margin: "0 0 24px", color: "var(--text-soft)" }}>Create your first event to start registering students and issuing certificates.</p>
              <Link to="/hackathon/create" className="dashboard-btn-primary" style={{ textDecoration: "none" }}>
                Create your first hackathon →
              </Link>
            </div>
          ) : (
            <div className="dashboard-stat-grid">
              {hackathons.map((hackathon) => {
                const participantCount = getHackathonParticipants(hackathon.id).length;
                const batches = getHackathonBatches().filter((batch) => batch.hackathonId === hackathon.id);
                const latestBatch = batches[0];

                return (
                  <article className="dashboard-card" key={hackathon.id} style={{ display: "flex", flexDirection: "column", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)" }}>HACKATHON</span>
                      <div className={`dashboard-badge ${latestBatch ? 'success' : 'info'}`}>
                        {latestBatch ? latestBatch.status : "No batch"}
                      </div>
                    </div>

                    <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontFamily: "'Space Grotesk', sans-serif" }}>{hackathon.name}</h3>
                    <p style={{ margin: "0 0 24px", color: "var(--text-soft)", fontSize: "13px", flex: 1 }}>{hackathon.description}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", padding: "16px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
                      <div>
                        <span style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>DATE</span>
                        <strong style={{ fontSize: "12px" }}>{hackathon.eventDate}</strong>
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>PEOPLE</span>
                        <strong style={{ fontSize: "12px" }}>{participantCount}</strong>
                      </div>
                      <div>
                        <span style={{ display: "block", fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>VENUE</span>
                        <strong style={{ fontSize: "12px" }}>{hackathon.venue || "TBD"}</strong>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link to={`/hackathon/${hackathon.id}/participants`} className="dashboard-btn-secondary" style={{ textDecoration: "none", fontSize: "12px", padding: "8px 16px" }}>
                        Manage Event →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </HackathonLayout>
  );
}