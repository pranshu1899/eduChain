import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getHackathons,
} from "../../services/hackathonService";

import type {
  HackathonEvent,
} from "../../types/hackathon";

export default function HackathonDashboard() {
  const navigate =
    useNavigate();

  const [
    hackathons,
    setHackathons,
  ] =
    useState<HackathonEvent[]>(
      [],
    );

  useEffect(() => {
    setHackathons(
      getHackathons(),
    );
  }, []);

  return (
    <div className="student-page-shell">
      <main className="student-main-content">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                opacity: 0.65,
                fontSize: "0.8rem",
                letterSpacing:
                  "0.12em",
              }}
            >
              HACKATHON ORGANIZATION
            </p>

            <h1>
              Hackathon Portal
            </h1>

            <p>
              Manage events, participants
              and batch certificates.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/hackathon/create",
              )
            }
          >
            + Create Hackathon
          </button>
        </div>

        {hackathons.length ===
        0 ? (
          <section className="dashboard-card">
            <h2>
              No hackathons yet
            </h2>

            <p>
              Create your first event
              to start adding students
              and generating certificates.
            </p>

            <Link
              to="/hackathon/create"
            >
              Create Hackathon
            </Link>
          </section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {hackathons.map(
              (hackathon) => (
                <section
                  className="dashboard-card"
                  key={hackathon.id}
                >
                  <p
                    style={{
                      opacity: 0.6,
                      fontSize:
                        "0.75rem",
                    }}
                  >
                    HACKATHON
                  </p>

                  <h2>
                    {hackathon.name}
                  </h2>

                  <p>
                    {
                      hackathon.description
                    }
                  </p>

                  <p>
                    📅{" "}
                    {
                      hackathon.eventDate
                    }
                  </p>

                  <Link
                    to={`/hackathon/${hackathon.id}`}
                  >
                    Manage Event →
                  </Link>
                </section>
              ),
            )}
          </div>
        )}
      </main>
    </div>
  );
}