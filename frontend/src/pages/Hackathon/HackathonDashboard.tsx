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
  getHackathonOrganizationByWallet,
} from "../../services/hackathonOrganizationService";

import type {
  HackathonEvent,
} from "../../types/hackathon";

import HackathonLayout from "./HackathonLayout";

export default function HackathonDashboard() {
  const [
    wallet,
    setWallet,
  ] = useState("");

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

      setWallet(address);

      const organization =
        getHackathonOrganizationByWallet(
          address,
        );

      if (!organization) {
        throw new Error(
          "No hackathon organization application exists for this wallet.",
        );
      }

      if (
        organization.status !==
        "APPROVED"
      ) {
        throw new Error(
          `Organization access is ${organization.status.toLowerCase()}. Admin approval is required.`,
        );
      }

      setOrganizationName(
        organization.organizationName,
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

        <section
          style={{
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              margin: 0,
              opacity: 0.55,
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
            }}
          >
            APPROVED ORGANIZATION
          </p>

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "flex-start",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1>
                {organizationName}
              </h1>

              <p>
                Create hackathons, register
                students, and issue
                cryptographically verifiable
                certificates.
              </p>
            </div>

            <Link
              to="/hackathon/create"
            >
              + Create Hackathon
            </Link>
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              opacity: 0.55,
              fontSize: "0.75rem",
              wordBreak: "break-all",
            }}
          >
            Connected wallet: {wallet}
          </div>
        </section>

        {/* STATS */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div className="dashboard-card">
            <p>Hackathons</p>
            <h2>
              {hackathons.length}
            </h2>
          </div>

          <div className="dashboard-card">
            <p>Participants</p>
            <h2>
              {totalParticipants}
            </h2>
          </div>

          <div className="dashboard-card">
            <p>Certificate Batches</p>
            <h2>
              {totalBatches}
            </h2>
          </div>
        </section>

        {/* EVENTS */}

        <section>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  opacity: 0.55,
                  fontSize: "0.7rem",
                  letterSpacing: "0.12em",
                }}
              >
                EVENTS
              </p>

              <h2>
                My Hackathons
              </h2>
            </div>

            <Link
              to="/hackathon/create"
            >
              Create →
            </Link>
          </div>

          {hackathons.length ===
          0 ? (
            <div className="dashboard-card">
              <h2>
                No hackathons yet
              </h2>

              <p>
                Create your first event to
                start registering students
                and issuing certificates.
              </p>

              <Link
                to="/hackathon/create"
              >
                Create your first hackathon →
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1rem",
              }}
            >
              {hackathons.map(
                (hackathon) => {
                  const participantCount =
                    getHackathonParticipants(
                      hackathon.id,
                    ).length;

                  const batches =
                    getHackathonBatches().filter(
                      (batch) =>
                        batch.hackathonId ===
                        hackathon.id,
                    );

                  const latestBatch =
                    batches[0];

                  return (
                    <article
                      className="dashboard-card"
                      key={
                        hackathon.id
                      }
                    >
                      <p
                        style={{
                          opacity: 0.55,
                          fontSize: "0.7rem",
                          letterSpacing:
                            "0.1em",
                        }}
                      >
                        HACKATHON
                      </p>

                      <h2>
                        {hackathon.name}
                      </h2>

                      <p>
                        {hackathon.description}
                      </p>

                      <div
                        style={{
                          display: "grid",
                          gap: "0.4rem",
                          margin:
                            "1rem 0",
                          opacity: 0.7,
                          fontSize: "0.85rem",
                        }}
                      >
                        <span>
                          📅{" "}
                          {hackathon.eventDate}
                        </span>

                        <span>
                          👥{" "}
                          {participantCount}{" "}
                          participant
                          {participantCount ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <span>
                          🔐{" "}
                          {latestBatch
                            ? latestBatch.status
                            : "No certificate batch"}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.6rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <Link
                          to={`/hackathon/${hackathon.id}/participants`}
                        >
                          Participants →
                        </Link>

                        <Link
                          to={`/hackathon/${hackathon.id}/certificates`}
                        >
                          Certificates →
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </HackathonLayout>
  );
}