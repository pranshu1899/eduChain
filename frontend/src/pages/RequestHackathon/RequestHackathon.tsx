import {
  useEffect,
  useState,
} from "react";
import { BrowserProvider } from "ethers";
import { Link } from "react-router-dom";

import {
  createHackathonOrganizationRequest,
} from "../../services/hackathonOrganizationService";

import {
  getHackathonOrganizationOnChain,
  requestHackathonOrganization,
} from "../../services/hackathonAccessService";

function getEthereum() {
  return (
    window as Window & {
      ethereum?: {
        request: (args: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };
    }
  ).ethereum;
}

function shortenAddress(
  address: string,
): string {
  if (!address) {
    return "";
  }

  return `${address.slice(
    0,
    6,
  )}...${address.slice(-4)}`;
}

export default function RequestHackathon() {
  const [wallet, setWallet] =
    useState("");

  const [organizationName, setOrganizationName] =
    useState("");

  const [
    organizationDescription,
    setOrganizationDescription,
  ] = useState("");

  const [organizerName, setOrganizerName] =
    useState("");

  const [organizerEmail, setOrganizerEmail] =
    useState("");

  const [website, setWebsite] =
    useState("");

  const [reason, setReason] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const [existingStatus, setExistingStatus] =
    useState<
      "APPROVED" | "PENDING" | null
    >(null);

  async function connectWallet() {
    try {
      setConnecting(true);
      setError("");

      const ethereum =
        getEthereum();

      if (!ethereum) {
        throw new Error(
          "MetaMask is not installed.",
        );
      }

      const provider =
        new BrowserProvider(
          ethereum,
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          [],
        );

      if (!accounts.length) {
        throw new Error(
          "No wallet account was selected.",
        );
      }

      const address =
        String(accounts[0]).toLowerCase();

      setWallet(address);

      await updateStatusFromAddress(address);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect wallet.",
      );
    } finally {
      setConnecting(false);
    }
  }

  async function updateStatusFromAddress(address: string) {
    try {
      const onChain = await getHackathonOrganizationOnChain(address);
      if (onChain) {
        if (onChain.status === 2) {
          setExistingStatus("APPROVED");
          return;
        } else if (onChain.status === 1) {
          setExistingStatus("PENDING");
          return;
        }
      }
      setExistingStatus(null);
    } catch (err) {
      console.error("Unable to verify on-chain status:", err);
      setExistingStatus(null);
    }
  }

  useEffect(() => {
    const ethereum =
      getEthereum();

    if (!ethereum) {
      return;
    }

    const handleAccountsChanged =
      (accounts: unknown) => {
        const list =
          Array.isArray(accounts)
            ? accounts
            : [];

        const address =
          list.length
            ? String(
                list[0],
              ).toLowerCase()
            : "";

        setWallet(address);

        if (!address) {
          setExistingStatus(null);
          return;
        }

        void updateStatusFromAddress(address);
      };

    ethereum.request({
      method: "eth_accounts",
    }).then(handleAccountsChanged)
      .catch(() => undefined);

    return () => {
      // MetaMask listener cleanup is intentionally
      // handled only when the provider exposes
      // the event API.
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (!wallet) {
        throw new Error(
          "Connect your organization wallet before submitting.",
        );
      }

      if (existingStatus === "APPROVED") {
        throw new Error(
          "This wallet is already an approved hackathon organization.",
        );
      }

      // First submit on-chain
      await requestHackathonOrganization(organizationName);

      // Then save metadata to localStorage
      const request =
        createHackathonOrganizationRequest({
          organizationName,
          organizationDescription,
          organizerName,
          organizerEmail,
          walletAddress: wallet,
          website,
          reason,
        });

      setMessage(
        `Application submitted successfully. Request ID: ${request.id}`,
      );

      setExistingStatus(
        "PENDING",
      );

      setOrganizationName("");
      setOrganizationDescription("");
      setOrganizerName("");
      setOrganizerEmail("");
      setWebsite("");
      setReason("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit application.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #171536 0%, #070814 48%, #05060d 100%)",
        color: "#f5f7ff",
        padding:
          "32px 20px 60px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link
          to="/"
          style={{
            color: "#a99cff",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to EduProof
        </Link>

        <div
          style={{
            marginTop: "42px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              color: "#9b8cff",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.14em",
            }}
          >
            HACKATHON NETWORK
          </div>

          <h1
            style={{
              fontSize:
                "clamp(38px, 7vw, 62px)",
              lineHeight: 1.02,
              margin:
                "12px 0 16px",
            }}
          >
            Become a
            <br />
            Hackathon Organization
          </h1>

          <p
            style={{
              maxWidth: "700px",
              color: "#969bb2",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Apply to issue cryptographically
            verifiable hackathon certificates
            through EduProof. Applications are
            reviewed and approved by the platform
            authority.
          </p>
        </div>

        <div
          style={{
            background:
              "rgba(16,17,29,0.92)",
            border:
              "1px solid #292c40",
            borderRadius: "22px",
            padding:
              "28px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              flexWrap: "wrap",
              marginBottom: "28px",
            }}
          >
            <div>
              <div
                style={{
                  color: "#737991",
                  fontSize: "11px",
                  textTransform:
                    "uppercase",
                  letterSpacing:
                    "0.1em",
                  marginBottom: "7px",
                }}
              >
                Organization Wallet
              </div>

              <code
                style={{
                  color: wallet
                    ? "#cbd0ff"
                    : "#737991",
                }}
              >
                {wallet
                  ? shortenAddress(wallet)
                  : "Not connected"}
              </code>
            </div>

            <button
              type="button"
              onClick={connectWallet}
              disabled={connecting}
              style={{
                padding:
                  "12px 18px",
                border: "none",
                borderRadius:
                  "10px",
                background:
                  "#6658d9",
                color: "#fff",
                fontWeight: 700,
                cursor:
                  connecting
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {connecting
                ? "Connecting..."
                : wallet
                  ? "Reconnect Wallet"
                  : "Connect MetaMask"}
            </button>
          </div>

          {existingStatus ===
            "PENDING" && (
            <div
              style={{
                padding:
                  "16px 18px",
                borderRadius:
                  "12px",
                background:
                  "#30270d",
                border:
                  "1px solid #65551b",
                color:
                  "#facc15",
                marginBottom:
                  "20px",
              }}
            >
              This wallet already has a
              pending application.
            </div>
          )}

          {existingStatus ===
            "APPROVED" && (
            <div
              style={{
                padding:
                  "16px 18px",
                borderRadius:
                  "12px",
                background:
                  "#0d2117",
                border:
                  "1px solid #1d5c38",
                color:
                  "#67e69a",
                marginBottom:
                  "20px",
              }}
            >
              This wallet is already an
              approved hackathon organization.
            </div>
          )}

          {message && (
            <div
              style={{
                padding:
                  "16px 18px",
                borderRadius:
                  "12px",
                background:
                  "#102719",
                border:
                  "1px solid #27613d",
                color:
                  "#67e69a",
                marginBottom:
                  "20px",
                wordBreak:
                  "break-word",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                padding:
                  "16px 18px",
                borderRadius:
                  "12px",
                background:
                  "#29141a",
                border:
                  "1px solid #6d2635",
                color:
                  "#ff9aaa",
                marginBottom:
                  "20px",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "18px",
              }}
            >
              <Field
                label="Organization Name"
                value={organizationName}
                onChange={setOrganizationName}
                placeholder="EduHack Foundation"
                required
              />

              <Field
                label="Organizer Name"
                value={organizerName}
                onChange={setOrganizerName}
                placeholder="Organizer / Founder"
                required
              />

              <Field
                label="Organizer Email"
                value={organizerEmail}
                onChange={setOrganizerEmail}
                placeholder="organizer@example.com"
                type="email"
                required
              />

              <Field
                label="Website"
                value={website}
                onChange={setWebsite}
                placeholder="https://example.com"
              />
            </div>

            <div
              style={{
                marginTop:
                  "18px",
              }}
            >
              <Field
                label="Organization Description"
                value={organizationDescription}
                onChange={
                  setOrganizationDescription
                }
                placeholder="Tell us about the organization and the hackathons you conduct."
                textarea
                required
              />
            </div>

            <div
              style={{
                marginTop:
                  "18px",
              }}
            >
              <Field
                label="Why should this organization be authorized?"
                value={reason}
                onChange={setReason}
                placeholder="Explain your hackathon history, audience, events, or planned use of EduProof."
                textarea
                required
              />
            </div>

            <button
              type="submit"
              disabled={
                loading ||
                !wallet ||
                existingStatus ===
                  "PENDING" ||
                existingStatus ===
                  "APPROVED"
              }
              style={{
                width: "100%",
                marginTop:
                  "24px",
                padding:
                  "15px 20px",
                border: "none",
                borderRadius:
                  "12px",
                background:
                  loading ||
                  !wallet ||
                  existingStatus
                    ? "#303349"
                    : "#7667e8",
                color: "#fff",
                fontWeight: 800,
                cursor:
                  loading ||
                  !wallet ||
                  existingStatus
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Submitting..."
                : "Submit Organization Application"}
            </button>
          </form>
        </div>

        <div
          style={{
            textAlign: "center",
            color: "#5f6478",
            fontSize: "13px",
            marginTop: "25px",
          }}
        >
          Approval is required before the
          organization can issue certificates.
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   FIELD
   ===================================================== */

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  textarea = false,
  required = false,
}: FieldProps) {
  const style = {
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding:
      "13px 14px",
    border:
      "1px solid #303349",
    borderRadius:
      "10px",
    background:
      "#080914",
    color:
      "#f5f7ff",
    outline:
      "none",
    fontFamily:
      "inherit",
    fontSize:
      "14px",
    resize:
      textarea
        ? ("vertical" as const)
        : undefined,
  };

  return (
    <label
      style={{
        display: "block",
      }}
    >
      <div
        style={{
          color: "#9297ad",
          fontSize: "12px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        {label}
        {required && " *"}
      </div>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={placeholder}
          required={required}
          rows={5}
          style={style}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
          placeholder={placeholder}
          required={required}
          style={style}
        />
      )}
    </label>
  );
}