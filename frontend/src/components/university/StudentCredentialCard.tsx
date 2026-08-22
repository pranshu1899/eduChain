interface StudentCredentialCardProps {
  id: number;
  studentDID: string;
  credentialType: string;
  degree: string;
  institution: string;
  issueDate: string;
  version: number;
  status: number;
  onView: (id: number) => void;
}

function shortDID(did: string) {
  if (!did) return "Unknown";

  if (did.length <= 28) {
    return did;
  }

  return `${did.slice(0, 16)}...${did.slice(-8)}`;
}

function formatStatus(status: number) {
  if (status === 0) return "ACTIVE";
  if (status === 1) return "REVOKED";
  if (status === 2) return "SUPERSEDED";

  return "UNKNOWN";
}

function formatDate(date: string) {
  if (!date) return "Unknown";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function StudentCredentialCard({
  id,
  studentDID,
  credentialType,
  degree,
  institution,
  issueDate,
  version,
  status,
  onView,
}: StudentCredentialCardProps) {
  const statusText = formatStatus(status);

  return (
    <article className="university-credential-card">

      <div className="credential-card-top">
        <div>
          <span className="credential-card-eyebrow">
            CREDENTIAL #{id}
          </span>

          <h3>
            {credentialType}
          </h3>
        </div>

        <span
          className={`credential-status ${statusText.toLowerCase()}`}
        >
          <span className="credential-status-dot" />
          {statusText}
        </span>
      </div>

      <div className="credential-degree">
        {degree}
      </div>

      <div className="credential-details">

        <div>
          <span>Student DID</span>

          <strong title={studentDID}>
            {shortDID(studentDID)}
          </strong>
        </div>

        <div>
          <span>Institution</span>

          <strong>
            {institution}
          </strong>
        </div>

        <div>
          <span>Issued</span>

          <strong>
            {formatDate(issueDate)}
          </strong>
        </div>

        <div>
          <span>Version</span>

          <strong>
            v{version}
          </strong>
        </div>

      </div>

      <button
        type="button"
        className="credential-view-button"
        onClick={() => onView(id)}
      >
        View credential
        <span>→</span>
      </button>

    </article>
  );
}