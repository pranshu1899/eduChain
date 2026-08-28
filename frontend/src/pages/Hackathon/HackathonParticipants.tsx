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

import HackathonLayout from "./HackathonLayout";

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

  const [
    did,
    setDid,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    team,
    setTeam,
  ] = useState("");

  const [
    project,
    setProject,
  ] = useState("");

  const [
    result,
    setResult,
  ] = useState("");

  const [
    rank,
    setRank,
  ] = useState("");

  const [
    award,
    setAward,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    setHackathon(
      getHackathonById(id),
    );

    setParticipants(
      getHackathonParticipants(
        id,
      ),
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
    const confirmed =
      window.confirm(
        "Remove this participant from the hackathon?",
      );

    if (!confirmed) {
      return;
    }

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
      <HackathonLayout>
        <main className="student-main-content">
          <h1>
            Hackathon not found
          </h1>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/hackathon",
              )
            }
          >
            Back to Hackathon Portal
          </button>
        </main>
      </HackathonLayout>
    );
  }

  return (
    <HackathonLayout>
      <main className="student-main-content">

        {/* HEADER */}

        <div
          style={{
            marginBottom: "2rem",
          }}
        >
          <Link
            to="/hackathon"
          >
            ← Hackathon Portal
          </Link>

          <p
            style={{
              marginTop: "1.5rem",
              marginBottom: 0,
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
            Register students using their
            decentralized identity before
            generating the certificate batch.
          </p>
        </div>

        {/* PROGRESS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            className="dashboard-card"
          >
            <strong>
              01
            </strong>

            <p>
              Add Participants
            </p>
          </div>

          <div
            className="dashboard-card"
            style={{
              opacity: 0.65,
            }}
          >
            <strong>
              02
            </strong>

            <p>
              Generate Certificates
            </p>
          </div>

          <div
            className="dashboard-card"
            style={{
              opacity: 0.65,
            }}
          >
            <strong>
              03
            </strong>

            <p>
              Anchor Merkle Batch
            </p>
          </div>
        </div>

        {/* ADD PARTICIPANT */}

        <section
          className="dashboard-card"
          style={{
            marginBottom: "1.5rem",
          }}
        >
          <p
            style={{
              opacity: 0.55,
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
            }}
          >
            STUDENT REGISTRATION
          </p>

          <h2>
            Add Participant
          </h2>

          <p>
            The DID is the student's
            decentralized identity and is used
            as the primary identity reference.
          </p>

          <form
            onSubmit={
              handleSubmit
            }
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
                  borderRadius:
                    "0.75rem",
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

        {/* PARTICIPANTS */}

        <section className="dashboard-card">
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <div>
              <p
                style={{
                  opacity: 0.55,
                  fontSize: "0.7rem",
                  letterSpacing:
                    "0.12em",
                }}
              >
                REGISTERED STUDENTS
              </p>

              <h2>
                {participants.length}{" "}
                Participant
                {participants.length ===
                1
                  ? ""
                  : "s"}
              </h2>
            </div>

            {participants.length >
              0 && (
              <Link
                to={`/hackathon/${hackathon.id}/certificates`}
              >
                Generate Certificates →
              </Link>
            )}
          </div>

          {participants.length ===
          0 ? (
            <div>
              <p>
                No participants have been
                added yet.
              </p>
            </div>
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
                  index,
                ) => (
                  <div
                    key={
                      participant.id
                    }
                    style={{
                      padding:
                        "1rem",
                      border:
                        "1px solid rgba(255,255,255,0.08)",
                      borderRadius:
                        "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        gap: "1rem",
                        alignItems:
                          "flex-start",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            opacity:
                              0.45,
                            fontSize:
                              "0.7rem",
                          }}
                        >
                          #{index + 1}
                        </span>

                        <h3>
                          {
                            participant.name
                          }
                        </h3>

                        <code
                          style={{
                            fontSize:
                              "0.75rem",
                            wordBreak:
                              "break-all",
                          }}
                        >
                          {
                            participant.did
                          }
                        </code>

                        {(participant.team ||
                          participant.project ||
                          participant.award) && (
                          <p
                            style={{
                              opacity:
                                0.7,
                              fontSize:
                                "0.8rem",
                              marginTop:
                                "0.5rem",
                            }}
                          >
                            {participant.team &&
                              `Team: ${participant.team}`}

                            {participant.team &&
                              participant.project &&
                              " • "}

                            {participant.project &&
                              `Project: ${participant.project}`}

                            {participant.award &&
                              ` • ${participant.award}`}
                          </p>
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
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* NEXT STEP */}

        {participants.length >
          0 && (
          <div
            style={{
              marginTop: "1.5rem",
              display: "flex",
              justifyContent:
                "flex-end",
            }}
          >
            <Link
              to={`/hackathon/${hackathon.id}/certificates`}
            >
              Continue to Certificate Batch →
            </Link>
          </div>
        )}
      </main>
    </HackathonLayout>
  );
}