import { useEffect, useState } from "react";

import {
  getAllCredentials,
  type Credential,
} from "../../config/contractService";

export default function IssuerCredentials() {
  const [credentials, setCredentials] =
    useState<Credential[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let mounted = true;

    const loadCredentials = async () => {
      try {
        setLoading(true);
        setError("");

        const result =
          await getAllCredentials();

        if (mounted) {
          setCredentials(result);
        }
      } catch (loadError) {
        console.error(
          "Unable to load credentials:",
          loadError,
        );

        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load credentials.",
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadCredentials();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page">
      <section className="student-page-header">
        <div>
          <span className="student-page-eyebrow">
            ISSUER PORTAL
          </span>

          <h1>Issued Credentials</h1>

          <p>
            Credentials currently available through
            the EduProof registry.
          </p>
        </div>
      </section>

      {loading && (
        <section className="student-panel">
          <p>Loading credentials...</p>
        </section>
      )}

      {error && (
        <section className="student-error">
          <strong>Credential Error</strong>

          <p>{error}</p>
        </section>
      )}

      {!loading &&
        !error &&
        credentials.length === 0 && (
          <section className="student-panel">
            <div className="student-empty">
              <h3>No credentials found</h3>

              <p>
                No credentials are currently available
                from the registry.
              </p>
            </div>
          </section>
        )}

      {!loading &&
        !error &&
        credentials.length > 0 && (
          <section className="student-panel">
            <div className="student-credential-grid">
              {credentials.map((credential) => (
                <div
                  key={credential.id}
                  className="student-credential-card"
                >
                  <span>
                    CREDENTIAL #{credential.id}
                  </span>

                  <h3>
                    {credential.degree ||
                      credential.credentialType}
                  </h3>

                  <p>
                    Student DID:{" "}
                    {credential.studentDID}
                  </p>

                  <p>
                    Institution:{" "}
                    {credential.institution}
                  </p>

                  <p>
                    Status:{" "}
                    {credential.active
                      ? "ACTIVE"
                      : "INACTIVE"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}