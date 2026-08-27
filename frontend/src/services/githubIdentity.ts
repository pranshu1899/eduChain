export interface GitHubIdentity {
  id: number;
  login: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  type: string;
}

export interface GitHubRepositoryEvidence {
  id: number;
  name: string;
  fullName: string;
  url: string;
  owner: string;
  ownerId: number;
  defaultBranch: string;
  private: boolean;
}

export interface GitHubCommitEvidence {
  sha: string;
  url: string;
  message: string;
  date: string;
}

export interface GitHubVerificationResult {
  verified: boolean;

  verification?: {
    identityMatch: boolean;
    repositoryAccessible: boolean;
    repositoryOwnerVerified: boolean;
    latestCommitVerified: boolean;
  };

  githubUser?: GitHubIdentity;

  repository?: GitHubRepositoryEvidence;

  latestCommit?: GitHubCommitEvidence;

  reason?: string;
}

const GITHUB_AUTH_URL =
  "http://localhost:4000";

const SESSION_STORAGE_KEY =
  "eduproof:github-session";

/* =====================================================
   SESSION
   ===================================================== */

export function getGitHubSession():
  string | null {
  return localStorage.getItem(
    SESSION_STORAGE_KEY
  );
}

export function setGitHubSession(
  session: string
): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    session
  );
}

export function clearGitHubSession(): void {
  localStorage.removeItem(
    SESSION_STORAGE_KEY
  );
}

/* =====================================================
   CONNECT GITHUB
   ===================================================== */

export function connectGitHub(): void {
  window.location.href =
    `${GITHUB_AUTH_URL}/auth/github`;
}

/* =====================================================
   GET IDENTITY
   ===================================================== */

export async function getGitHubIdentity(): Promise<GitHubIdentity> {
  const session =
    getGitHubSession();

  if (!session) {
    throw new Error(
      "GitHub is not connected."
    );
  }

  const response =
    await fetch(
      `${GITHUB_AUTH_URL}/api/github/identity`,
      {
        headers: {
          "X-GitHub-Session":
            session,
        },
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.authenticated ||
    !data.githubUser
  ) {
    clearGitHubSession();

    throw new Error(
      data.error ||
        "GitHub session is invalid or expired."
    );
  }

  return data.githubUser as GitHubIdentity;
}

/* =====================================================
   VERIFY REPOSITORY
   ===================================================== */

export async function verifyGitHubRepository(
  owner: string,
  repo: string
): Promise<GitHubVerificationResult> {
  const session =
    getGitHubSession();

  if (!session) {
    throw new Error(
      "Connect GitHub before verifying a repository."
    );
  }

  const params =
    new URLSearchParams({
      owner,
      repo,
    });

  const response =
    await fetch(
      `${GITHUB_AUTH_URL}/api/github/repository?${params.toString()}`,
      {
        headers: {
          "X-GitHub-Session":
            session,
        },
      }
    );

  const data =
    (await response.json()) as GitHubVerificationResult;

  if (
    response.status ===
    401
  ) {
    clearGitHubSession();

    throw new Error(
      data.reason ||
        "GitHub session expired. Please connect GitHub again."
    );
  }

  if (
    response.status ===
    403
  ) {
    return data;
  }

  if (!response.ok) {
    throw new Error(
      data.reason ||
        "Unable to verify GitHub repository."
    );
  }

  return data;
}

/* =====================================================
   HANDLE OAUTH CALLBACK
   ===================================================== */

export function consumeGitHubSessionFromUrl(): string | null {
  const url =
    new URL(
      window.location.href
    );

  const session =
    url.searchParams.get(
      "github_session"
    );

  if (!session) {
    return null;
  }

  setGitHubSession(
    session
  );

  /*
   * Remove the session token from the browser URL.
   *
   * This prevents it from remaining visible in
   * the address bar after OAuth completes.
   */

  url.searchParams.delete(
    "github_session"
  );

  window.history.replaceState(
    {},
    document.title,
    url.pathname +
      (
        url.search
          ? url.search
          : ""
      )
  );

  return session;
}

/* =====================================================
   LOGOUT
   ===================================================== */

export async function disconnectGitHub(): Promise<void> {
  const session =
    getGitHubSession();

  if (!session) {
    return;
  }

  try {
    await fetch(
      `${GITHUB_AUTH_URL}/api/github/logout`,
      {
        method: "POST",

        headers: {
          "X-GitHub-Session":
            session,
        },
      }
    );
  } finally {
    clearGitHubSession();
  }
}

/* =====================================================
   REPOSITORY URL PARSER
   ===================================================== */

export function parseGitHubRepositoryUrl(
  value: string
): {
  owner: string;
  repository: string;
} {
  let url: URL;

  try {
    url = new URL(
      value.trim()
    );
  } catch {
    throw new Error(
      "Enter a valid GitHub repository URL."
    );
  }

  if (
    url.hostname.toLowerCase() !==
    "github.com"
  ) {
    throw new Error(
      "Repository must be hosted on github.com."
    );
  }

  const parts =
    url.pathname
      .split("/")
      .filter(Boolean);

  if (
    parts.length <
    2
  ) {
    throw new Error(
      "Enter a complete GitHub repository URL."
    );
  }

  const owner =
    parts[0];

  const repository =
    parts[1]
      .replace(
        /\.git$/i,
        ""
      )
      .trim();

  if (
    !owner ||
    !repository
  ) {
    throw new Error(
      "Unable to determine repository owner and name."
    );
  }

  return {
    owner,
    repository,
  };
}