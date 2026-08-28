import {
  useEffect,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  BrowserProvider,
} from "ethers";

import {
  createHackathon,
} from "../../services/hackathonService";

import {
  getHackathonOrganizationOnChain,
} from "../../services/hackathonAccessService";

import HackathonLayout from "./HackathonLayout";

export default function HackathonCreateEvent() {
  const navigate =
    useNavigate();

  const [
    organizationId,
    setOrganizationId,
  ] = useState("");

  const [
    organizationWallet,
    setOrganizationWallet,
  ] = useState("");

  const [
    organizationName,
    setOrganizationName,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  const [
    venue,
    setVenue,
  ] = useState("");

  const [
    website,
    setWebsite,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    void loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      if (
        !window.ethereum
      ) {
        throw new Error(
          "MetaMask is required.",
        );
      }

      const provider =
        new BrowserProvider(
          window.ethereum,
        );

      const signer =
        await provider.getSigner();

      const wallet =
        await signer.getAddress();

      const organization =
        await getHackathonOrganizationOnChain(
          wallet,
        );

      if (!organization || organization.status === 0) {
        throw new Error(
          "No organization application was found for this wallet.",
        );
      }

      if (
        organization.status !== 2
      ) {
        throw new Error(
          "Your hackathon organization must be approved by an admin before you can create events.",
        );
      }

      // We still need an organization ID for creating the hackathon locally,
      // but the blockchain doesn't have an ID string. We can use the wallet address
      // as the ID, or read the local storage for the UUID if it exists.
      // Actually, since HackathonCreateEvent just needs an ID, we'll use wallet.
      setOrganizationId(
        wallet,
      );

      setOrganizationWallet(
        wallet,
      );

      setOrganizationName(
        organization.organizationName,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load organization.",
      );
    } finally {
      setLoading(false);
    }
  }

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

  if (loading) {
    return (
      <HackathonLayout>
        <div className="student-main-content">
          <p>
            Loading organization...
          </p>
        </div>
      </HackathonLayout>
    );
  }

  return (
    <HackathonLayout>
      <main className="student-main-content">

        <button
          type="button"
          onClick={() =>
            navigate(
              "/hackathon",
            )
          }
        >
          ← Back to Portal
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
            EVENT MANAGEMENT
          </p>

          <h1>
            Create Hackathon
          </h1>

          <p>
            {organizationName
              ? `Create an event for ${organizationName}.`
              : "Create an event before registering participants."}
          </p>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="dashboard-card"
          style={{
            maxWidth: "760px",
          }}
        >
          {/* AUTO-RESOLVED ORGANIZATION */}

          <div
            style={{
              padding: "1rem",
              marginBottom: "1.25rem",
              borderRadius: "12px",
              border:
                "1px solid rgba(74,222,128,0.25)",
              background:
                "rgba(74,222,128,0.05)",
            }}
          >
            <strong>
              ✓ Approved Organization
            </strong>

            <p
              style={{
                margin:
                  "0.35rem 0 0",
                opacity: 0.65,
                fontSize: "0.8rem",
                wordBreak:
                  "break-all",
              }}
            >
              {organizationName}
              <br />
              {organizationWallet}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
            }}
          >
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
                value={
                  description
                }
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
                value={
                  eventDate
                }
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
                  borderRadius:
                    "0.75rem",
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
    </HackathonLayout>
  );
}