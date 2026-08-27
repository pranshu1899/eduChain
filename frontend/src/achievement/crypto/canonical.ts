/**
 * Deterministic serialization for cryptographic hashing.
 *
 * We deliberately avoid JSON.stringify() because object
 * property ordering should not be relied upon for commitments.
 */

function normalizeString(value: string): string {
  return value.trim();
}

function normalizeSkills(skills: string[]): string[] {
  return [...skills]
    .map((skill) => normalizeString(skill))
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b)
    );
}

export function canonicalizeProjectEvidence(
  data: {
    projectId: string;
    owner: string;
    repository: string;
    commit: string;
    skills: string[];
    timestamp: number;
  }
): string {
  const skills =
    normalizeSkills(data.skills);

  return [
    `projectId=${normalizeString(data.projectId)}`,
    `owner=${normalizeString(data.owner).toLowerCase()}`,
    `repository=${normalizeString(data.repository)}`,
    `commit=${normalizeString(data.commit)}`,
    `skills=${skills.join(",")}`,
    `timestamp=${data.timestamp}`,
  ].join("|");
}