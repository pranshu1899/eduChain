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

        <section className="student-page-header">
          <div>
            <div className="student-page-eyebrow">HACKATHON ORGANIZATION</div>
            <h1>{organizationName}</h1>
            <p>
              Create hackathons, register students, and issue cryptographically verifiable certificates.
            </p>
          </div>
          <div>
            <Link to="/hackathon/create" className="student-connect-large" style={{ textDecoration: "none", display: "inline-block" }}>
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

          <div className="student-stat-grid">
            <div className="student-stat-card purple">
              <span>HACKATHONS</span>
              <strong>{hackathons.length}</strong>
              <p>Total events</p>
            </div>

            <div className="student-stat-card green">
              <span>PARTICIPANTS</span>
              <strong>{totalParticipants}</strong>
              <p>Total registered</p>
            </div>

            <div className="student-stat-card yellow">
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
            <div className="student-empty">
              <div className="student-empty-icon">📅</div>
              <h3>No hackathons yet</h3>
              <p>Create your first event to start registering students and issuing certificates.</p>
              <Link to="/hackathon/create" style={{ color: "#9c96ff", textDecoration: "none", fontSize: "12px", fontWeight: 700, marginTop: "8px" }}>
                Create your first hackathon →
              </Link>
            </div>
          ) : (
            <div className="student-credential-grid">
              {hackathons.map((hackathon) => {
                const participantCount = getHackathonParticipants(hackathon.id).length;
                const batches = getHackathonBatches().filter((batch) => batch.hackathonId === hackathon.id);
                const latestBatch = batches[0];

                return (
                  <article className="student-credential-card" key={hackathon.id} style={{ display: "flex", flexDirection: "column" }}>
                    <div className="student-credential-top">
                      <span>HACKATHON</span>
                      <div className={`student-status ${latestBatch ? 'active' : ''}`}>
                        <span></span>
                        {latestBatch ? latestBatch.status : "No batch"}
                      </div>
                    </div>

                    <h3>{hackathon.name}</h3>
                    <p style={{ flex: 1, marginBottom: "16px" }}>{hackathon.description}</p>

                    <div className="student-credential-details" style={{ marginTop: "auto" }}>
                      <div>
                        <span>DATE</span>
                        <strong>{hackathon.eventDate}</strong>
                      </div>
                      <div>
                        <span>PEOPLE</span>
                        <strong>{participantCount}</strong>
                      </div>
                      <div>
                        <span>VENUE</span>
                        <strong>{hackathon.venue || "TBD"}</strong>
                      </div>
                    </div>

                    <div className="student-card-action">
                      <Link to={`/hackathon/${hackathon.id}/participants`} style={{ color: "inherit", textDecoration: "none" }}>
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