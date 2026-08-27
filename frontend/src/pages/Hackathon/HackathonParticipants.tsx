import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  addHackathonParticipant,
  getHackathonById,
  getHackathonParticipants,
  removeHackathonParticipant,
} from "../../services/hackathonService";

import type {
  HackathonEvent,
  HackathonParticipant,
} from "../../types/hackathon";

export default function HackathonParticipants() {
  const {
    id,
  } = useParams<{
    id: string;
  }>();

  const navigate =
    useNavigate();

  const [
    hackathon,
    setHackathon,
  ] =
    useState<HackathonEvent | null>(
      null,
    );

  const [
    participants,
    setParticipants,
  ] =
    useState<HackathonParticipant[]>(
      [],
    );

  const [did, setDid] =
    useState("");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [team, setTeam] =
    useState("");

  const [project, setProject] =
    useState("");

  const [result, setResult] =
    useState("");

  const [rank, setRank] =
    useState("");

  const [award, setAward] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    setHackathon(
      getHackathonById(id),
    );

    setParticipants(
      getHackathonParticipants(id),
    );
  }, [id]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!id) {
      setError(
        "Hackathon ID is missing.",
      );
      return;
    }

    setError("");

    try {
      const participant =
        addHackathonParticipant({
          hackathonId: id,
          did,
          name,
          email,
          team,
          project,
          result,
          rank:
            rank.trim()
              ? Number(rank)
              : undefined,
          award,
        });

      setParticipants(
        (current) => [
          participant,
          ...current,
        ],
      );

      setDid("");
      setName("");
      setEmail("");
      setTeam("");
      setProject("");
      setResult("");
      setRank("");
      setAward("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add participant.",
      );
    }
  }

  function handleRemove(
    participantId: string,
  ) {
    removeHackathonParticipant(
      participantId,
    );

    setParticipants(
      (current) =>
        current.filter(
          (participant) =>
            participant.id !==
            participantId,
        ),
    );
  }

  if (!hackathon) {
    return (
      <div className="student-page-shell">
        <main className="student-main-content">
          <h1>
            Hackathon not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate("/hackathon")
            }
          >
            Back to Hackathons
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="student-page-shell">
      <main className="student-main-content">
        <button
          type="button"
          onClick={() =>
            navigate("/hackathon")
          }
        >
          ← Hackathons
        </button>

        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <p
            style={{
              opacity: 0.6,
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
            }}
          >
            PARTICIPANT MANAGEMENT
          </p>

          <h1>
            {hackathon.name}
          </h1>

          <p>
            Add students using their
            decentralized identity.
          </p>
        </div>

        <section
          className="dashboard-card"
          style={{
            marginBottom: "1.5rem",
          }}
        >
          <h2>
            Add Participant
          </h2>

          <form
            onSubmit={handleSubmit}
          >
            <div
              style={{
                display: "grid",
                gap: "1rem",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <label>
                Student DID
                <input
                  value={did}
                  onChange={(event) =>
                    setDid(
                      event.target.value,
                    )
                  }
                  placeholder="did:eduproof:..."
                  required
                />
              </label>

              <label>
                Student Name
                <input
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value,
                    )
                  }
                  placeholder="Full name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Team
                <input
                  value={team}
                  onChange={(event) =>
                    setTeam(
                      event.target.value,
                    )
                  }
                  placeholder="Team name"
                />
              </label>

              <label>
                Project
                <input
                  value={project}
                  onChange={(event) =>
                    setProject(
                      event.target.value,
                    )
                  }
                  placeholder="Project name"
                />
              </label>

              <label>
                Result
                <input
                  value={result}
                  onChange={(event) =>
                    setResult(
                      event.target.value,
                    )
                  }
                  placeholder="Winner / Finalist / Participant"
                />
              </label>

              <label>
                Rank
                <input
                  type="number"
                  min="1"
                  value={rank}
                  onChange={(event) =>
                    setRank(
                      event.target.value,
                    )
                  }
                  placeholder="Optional"
                />
              </label>

              <label>
                Award
                <input
                  value={award}
                  onChange={(event) =>
                    setAward(
                      event.target.value,
                    )
                  }
                  placeholder="Best Blockchain Project"
                />
              </label>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: "1rem",
                  padding: "0.9rem",
                  borderRadius: "0.75rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                marginTop: "1rem",
              }}
            >
              + Add Student
            </button>
          </form>
        </section>

        <section className="dashboard-card">
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <h2>
                Participants
              </h2>

              <p>
                {participants.length}{" "}
                student
                {participants.length ===
                1
                  ? ""
                  : "s"}{" "}
                registered
              </p>
            </div>

            {participants.length >
              0 && (
              <Link
                to={`/hackathon/${hackathon.id}/certificates`}
              >
                Continue to Certificates →
              </Link>
            )}
          </div>

          {participants.length ===
          0 ? (
            <p>
              No participants have been
              added yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "0.75rem",
              }}
            >
              {participants.map(
                (
                  participant,
                ) => (
                  <div
                    key={
                      participant.id
                    }
                    style={{
                      padding:
                        "1rem",
                      border:
                        "1px solid currentColor",
                      borderRadius:
                        "0.75rem",
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <strong>
                        {
                          participant.name
                        }
                      </strong>

                      <div
                        style={{
                          opacity:
                            0.65,
                          fontSize:
                            "0.8rem",
                          marginTop:
                            "0.25rem",
                        }}
                      >
                        {
                          participant.did
                        }
                      </div>

                      {(participant.team ||
                        participant.project) && (
                        <div
                          style={{
                            marginTop:
                              "0.35rem",
                            fontSize:
                              "0.85rem",
                          }}
                        >
                          {participant.team &&
                            `Team: ${participant.team}`}
                          {participant.team &&
                            participant.project &&
                            " • "}
                          {participant.project &&
                            `Project: ${participant.project}`}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemove(
                          participant.id,
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}