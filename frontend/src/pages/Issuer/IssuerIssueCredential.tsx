import type { FormEvent } from "react";

import { useState } from "react";

import {
  issueCredential,
} from "../../config/contractService";

export default function IssuerIssueCredential() {
  const [studentDID, setStudentDID] =
    useState("");

  const [credentialType, setCredentialType] =
    useState("B.Tech");

  const [degree, setDegree] =
    useState("Bachelor of Technology");

  const [issueDate, setIssueDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10),
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!studentDID.trim()) {
      setError(
        "Student DID is required.",
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * This page is intentionally kept minimal.
       * The existing contract service remains the
       * source of truth for blockchain interaction.
       */
      const result =
        await issueCredential(
          studentDID.trim(),
          credentialType.trim(),
          degree.trim(),
          issueDate,
        );

      setSuccess(
        `Credential issued successfully. Transaction: ${result.transactionHash}`,
      );

      setStudentDID("");
    } catch (issueError) {
      console.error(
        "Credential issuance failed:",
        issueError,
      );

      setError(
        issueError instanceof Error
          ? issueError.message
          : "Unable to issue credential.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="student-page-header">
        <div>
          <span className="student-page-eyebrow">
            ISSUER PORTAL
          </span>

          <h1>Issue Credential</h1>

          <p>
            Create a blockchain-backed academic
            credential for a student.
          </p>
        </div>
      </section>

      <section className="student-panel">
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "18px",
            maxWidth: "720px",
          }}
        >
          <label>
            <span>Student DID</span>

            <input
              value={studentDID}
              onChange={(event) =>
                setStudentDID(
                  event.target.value,
                )
              }
              placeholder="did:eduproof:..."
              required
            />
          </label>

          <label>
            <span>Credential Type</span>

            <input
              value={credentialType}
              onChange={(event) =>
                setCredentialType(
                  event.target.value,
                )
              }
              placeholder="B.Tech"
              required
            />
          </label>

          <label>
            <span>Degree</span>

            <input
              value={degree}
              onChange={(event) =>
                setDegree(
                  event.target.value,
                )
              }
              placeholder="Bachelor of Technology"
              required
            />
          </label>

          <label>
            <span>Issue Date</span>

            <input
              type="date"
              value={issueDate}
              onChange={(event) =>
                setIssueDate(
                  event.target.value,
                )
              }
              required
            />
          </label>

          {error && (
            <div className="student-error">
              {error}
            </div>
          )}

          {success && (
            <div className="student-proof-valid">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="student-connect-large"
            disabled={loading}
          >
            {loading
              ? "Issuing..."
              : "Issue Credential"}
          </button>
        </form>
      </section>
    </div>
  );
}