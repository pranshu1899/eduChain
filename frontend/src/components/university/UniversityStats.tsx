interface UniversityStatsProps {
  total: number;
  active: number;
  superseded: number;
  revoked: number;
}

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  tone: "purple" | "green" | "amber" | "red";
  icon: string;
}

function StatCard({
  label,
  value,
  description,
  tone,
  icon,
}: StatCardProps) {
  return (
    <div className={`university-stat-card ${tone}`}>
      <div className="university-stat-top">
        <div className={`university-stat-icon ${tone}`}>
          {icon}
        </div>

        <span className="university-stat-label">
          {label}
        </span>
      </div>

      <div className="university-stat-value">
        {value}
      </div>

      <div className="university-stat-description">
        {description}
      </div>
    </div>
  );
}

export default function UniversityStats({
  total,
  active,
  superseded,
  revoked,
}: UniversityStatsProps) {
  return (
    <section className="university-stats">

      <StatCard
        label="Total Issued"
        value={total}
        description="All credentials issued"
        tone="purple"
        icon="▣"
      />

      <StatCard
        label="Active"
        value={active}
        description="Currently valid"
        tone="green"
        icon="✓"
      />

      <StatCard
        label="Superseded"
        value={superseded}
        description="Replaced by newer versions"
        tone="amber"
        icon="↻"
      />

      <StatCard
        label="Revoked"
        value={revoked}
        description="Revoked on-chain"
        tone="red"
        icon="×"
      />

    </section>
  );
}