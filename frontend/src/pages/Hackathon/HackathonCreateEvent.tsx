import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  createHackathon,
} from "../../services/hackathonService";

export default function HackathonCreateEvent() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [eventDate, setEventDate] =
    useState("");

  const [venue, setVenue] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [organizationId, setOrganizationId] =
    useState("");

  const [organizationWallet, setOrganizationWallet] =
    useState("");

  const [error, setError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    try {
      setSaving(true);

      const hackathon =
        createHackathon({
          organizationId,
          organizationWallet,
          name,
          description,
          eventDate,
          venue,
          website,
        });

      navigate(
        `/hackathon/${hackathon.id}/participants`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create hackathon.",
      );
    } finally {
      setSaving(false);
    }
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
          ← Back
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
            HACKATHON ORGANIZATION
          </p>

          <h1>
            Create Hackathon
          </h1>

          <p>
            Create an event before adding
            participants and generating
            certificates.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="dashboard-card"
          style={{
            maxWidth: "760px",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
            <label>
              Organization ID
              <input
                value={organizationId}
                onChange={(event) =>
                  setOrganizationId(
                    event.target.value,
                  )
                }
                placeholder="Your approved organization ID"
                required
              />
            </label>

            <label>
              Organization Wallet
              <input
                value={organizationWallet}
                onChange={(event) =>
                  setOrganizationWallet(
                    event.target.value,
                  )
                }
                placeholder="0x..."
                required
              />
            </label>

            <label>
              Hackathon Name
              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value,
                  )
                }
                placeholder="e.g. EduProof Hackathon 2026"
                required
              />
            </label>

            <label>
              Description
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value,
                  )
                }
                placeholder="Describe the hackathon"
                rows={5}
                required
              />
            </label>

            <label>
              Event Date
              <input
                type="date"
                value={eventDate}
                onChange={(event) =>
                  setEventDate(
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Venue
              <input
                value={venue}
                onChange={(event) =>
                  setVenue(
                    event.target.value,
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={website}
                onChange={(event) =>
                  setWebsite(
                    event.target.value,
                  )
                }
                placeholder="https://..."
              />
            </label>

            {error && (
              <div
                role="alert"
                style={{
                  padding: "0.9rem",
                  borderRadius: "0.75rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
            >
              {saving
                ? "Creating..."
                : "Create Hackathon"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}