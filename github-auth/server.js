const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();

const PORT = Number(process.env.PORT || 4000);

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

const GITHUB_CLIENT_ID =
  process.env.GITHUB_CLIENT_ID;

const GITHUB_CLIENT_SECRET =
  process.env.GITHUB_CLIENT_SECRET;

const GITHUB_CALLBACK_URL =
  process.env.GITHUB_CALLBACK_URL ||
  `http://localhost:${PORT}/auth/github/callback`;

if (
  !GITHUB_CLIENT_ID ||
  !GITHUB_CLIENT_SECRET
) {
  console.error(
    "Missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET in .env"
  );

  process.exit(1);
}

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

/* =====================================================
   TEMPORARY OAUTH STATE
   ===================================================== */

const oauthStates = new Map();

function createState() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function cleanupExpiredStates() {
  const now = Date.now();

  for (
    const [state, createdAt] of oauthStates.entries()
  ) {
    if (
      now - createdAt >
      10 * 60 * 1000
    ) {
      oauthStates.delete(state);
    }
  }
}

/* =====================================================
   TEMPORARY LOCAL GITHUB SESSIONS
   ===================================================== */

/*
 * This is intentionally an in-memory store for
 * local development.
 *
 * Production should use a proper server-side
 * session/database/secure cookie architecture.
 */

const githubSessions = new Map();

function createSessionToken() {
  return crypto
    .randomBytes(32)
    .toString("hex");
}

function cleanupExpiredSessions() {
  const now = Date.now();

  for (
    const [token, session] of githubSessions.entries()
  ) {
    if (
      now - session.createdAt >
      60 * 60 * 1000
    ) {
      githubSessions.delete(token);
    }
  }
}

/* =====================================================
   GITHUB API HELPER
   ===================================================== */

async function githubRequest(
  endpoint,
  accessToken
) {
  const response = await fetch(
    `https://api.github.com${endpoint}`,
    {
      headers: {
        Accept:
          "application/vnd.github+json",

        Authorization:
          `Bearer ${accessToken}`,

        "X-GitHub-Api-Version":
          "2022-11-28",

        "User-Agent":
          "EduProof-GitHub-Identity",
      },
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return {
    response,
    data,
  };
}

/* =====================================================
   HEALTH CHECK
   ===================================================== */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service:
      "EduProof GitHub Identity Service",
  });
});

/* =====================================================
   START GITHUB OAUTH
   ===================================================== */

app.get(
  "/auth/github",
  (req, res) => {
    cleanupExpiredStates();

    const state =
      createState();

    oauthStates.set(
      state,
      Date.now()
    );

    const params =
      new URLSearchParams({
        client_id:
          GITHUB_CLIENT_ID,

        redirect_uri:
          GITHUB_CALLBACK_URL,

        scope:
          "read:user",

        state,
      });

    const githubAuthorizationUrl =
      `https://github.com/login/oauth/authorize?${params.toString()}`;

    res.redirect(
      githubAuthorizationUrl
    );
  }
);

/* =====================================================
   GITHUB OAUTH CALLBACK
   ===================================================== */

app.get(
  "/auth/github/callback",
  async (req, res) => {
    try {
      const {
        code,
        state,
      } = req.query;

      if (
        !code ||
        typeof code !==
          "string"
      ) {
        return res
          .status(400)
          .send(
            "Missing GitHub authorization code."
          );
      }

      if (
        !state ||
        typeof state !==
          "string"
      ) {
        return res
          .status(400)
          .send(
            "Missing OAuth state."
          );
      }

      const stateCreatedAt =
        oauthStates.get(
          state
        );

      if (!stateCreatedAt) {
        return res
          .status(400)
          .send(
            "Invalid or expired OAuth state."
          );
      }

      if (
        Date.now() -
          stateCreatedAt >
        10 * 60 * 1000
      ) {
        oauthStates.delete(
          state
        );

        return res
          .status(400)
          .send(
            "OAuth state expired."
          );
      }

      oauthStates.delete(
        state
      );

      /* ---------------------------------------------
         Exchange authorization code for token
         --------------------------------------------- */

      const tokenResponse =
        await fetch(
          "https://github.com/login/oauth/access_token",
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              client_id:
                GITHUB_CLIENT_ID,

              client_secret:
                GITHUB_CLIENT_SECRET,

              code,

              redirect_uri:
                GITHUB_CALLBACK_URL,
            }),
          }
        );

      if (
        !tokenResponse.ok
      ) {
        console.error(
          "GitHub token exchange failed:",
          await tokenResponse.text()
        );

        return res
          .status(502)
          .send(
            "GitHub token exchange failed."
          );
      }

      const tokenData =
        await tokenResponse.json();

      if (
        tokenData.error ||
        !tokenData.access_token
      ) {
        console.error(
          "GitHub OAuth error:",
          tokenData
        );

        return res
          .status(401)
          .send(
            "GitHub authorization failed."
          );
      }

      const accessToken =
        tokenData.access_token;

      /* ---------------------------------------------
         Fetch authenticated GitHub user
         --------------------------------------------- */

      const {
        response: userResponse,
        data: githubUser,
      } =
        await githubRequest(
          "/user",
          accessToken
        );

      if (
        !userResponse.ok ||
        !githubUser
      ) {
        console.error(
          "GitHub user request failed:",
          githubUser
        );

        return res
          .status(502)
          .send(
            "Unable to retrieve GitHub identity."
          );
      }

      /* ---------------------------------------------
         Create local session
         --------------------------------------------- */

      cleanupExpiredSessions();

      const sessionToken =
        createSessionToken();

      const identity = {
        id:
          githubUser.id,

        login:
          githubUser.login,

        name:
          githubUser.name || "",

        avatarUrl:
          githubUser.avatar_url ||
          "",

        profileUrl:
          githubUser.html_url ||
          "",

        type:
          githubUser.type ||
          "User",
      };

      githubSessions.set(
        sessionToken,
        {
          accessToken,
          identity,
          createdAt:
            Date.now(),
        }
      );

      /*
       * Do NOT send the GitHub access token
       * to the frontend.
       *
       * The frontend only receives a temporary
       * session identifier.
       */

      const redirectUrl =
        new URL(
          FRONTEND_URL
        );

      redirectUrl.pathname =
        "/student/evidence-test";

      redirectUrl.searchParams.set(
        "github_session",
        sessionToken
      );

      return res.redirect(
        redirectUrl.toString()
      );
    } catch (error) {
      console.error(
        "GitHub OAuth callback error:",
        error
      );

      return res
        .status(500)
        .send(
          "GitHub authentication failed."
        );
    }
  }
);

/* =====================================================
   GET AUTHENTICATED GITHUB IDENTITY
   ===================================================== */

app.get(
  "/api/github/identity",
  (req, res) => {
    cleanupExpiredSessions();

    const token =
      req.headers[
        "x-github-session"
      ];

    if (
      !token ||
      typeof token !==
        "string"
    ) {
      return res
        .status(401)
        .json({
          authenticated: false,
          error:
            "GitHub session is missing.",
        });
    }

    const session =
      githubSessions.get(
        token
      );

    if (!session) {
      return res
        .status(401)
        .json({
          authenticated: false,
          error:
            "GitHub session is invalid or expired.",
        });
    }

    return res.json({
      authenticated: true,

      githubUser:
        session.identity,
    });
  }
);

/* =====================================================
   VERIFY REPOSITORY
   ===================================================== */

app.get(
  "/api/github/repository",
  async (req, res) => {
    try {
      cleanupExpiredSessions();

      const sessionToken =
        req.headers[
          "x-github-session"
        ];

      if (
        !sessionToken ||
        typeof sessionToken !==
          "string"
      ) {
        return res
          .status(401)
          .json({
            verified: false,

            reason:
              "GitHub session is missing.",
          });
      }

      const session =
        githubSessions.get(
          sessionToken
        );

      if (!session) {
        return res
          .status(401)
          .json({
            verified: false,

            reason:
              "GitHub session is invalid or expired.",
          });
      }

      const owner =
        typeof req.query.owner ===
        "string"
          ? req.query.owner.trim()
          : "";

      const repo =
        typeof req.query.repo ===
        "string"
          ? req.query.repo.trim()
          : "";

      if (
        !owner ||
        !repo
      ) {
        return res
          .status(400)
          .json({
            verified: false,

            reason:
              "Repository owner and repository name are required.",
          });
      }

      /*
       * Ask GitHub for the authenticated
       * user's identity again.
       *
       * We do NOT trust the frontend.
       */

      const {
        response:
          userResponse,
        data:
          authenticatedUser,
      } =
        await githubRequest(
          "/user",
          session.accessToken
        );

      if (
        !userResponse.ok ||
        !authenticatedUser
      ) {
        return res
          .status(401)
          .json({
            verified: false,

            reason:
              "Unable to verify authenticated GitHub identity.",
          });
      }

      /*
       * Fetch the requested repository
       * using the authenticated token.
       */

      const {
        response:
          repositoryResponse,
        data:
          repositoryData,
      } =
        await githubRequest(
          `/repos/${encodeURIComponent(
            owner
          )}/${encodeURIComponent(
            repo
          )}`,
          session.accessToken
        );

      if (
        !repositoryResponse.ok ||
        !repositoryData
      ) {
        if (
          repositoryResponse.status ===
          404
        ) {
          return res
            .status(404)
            .json({
              verified: false,

              reason:
                "Repository was not found or is not accessible by the authenticated GitHub account.",
            });
        }

        return res
          .status(
            repositoryResponse.status
          )
          .json({
            verified: false,

            reason:
              "GitHub rejected the repository request.",
          });
      }

      /*
       * Compare GitHub numeric IDs.
       *
       * DO NOT rely only on usernames.
       *
       * GitHub usernames can change.
       */

      const authenticatedUserId =
        String(
          authenticatedUser.id
        );

      const repositoryOwnerId =
        String(
          repositoryData.owner?.id ??
            ""
        );

      const ownerMatches =
        authenticatedUserId ===
        repositoryOwnerId;

      /*
       * Fetch latest commit.
       */

      const {
        response:
          commitsResponse,
        data:
          commits,
      } =
        await githubRequest(
          `/repos/${encodeURIComponent(
            repositoryData.owner.login
          )}/${encodeURIComponent(
            repositoryData.name
          )}/commits?per_page=1`,
          session.accessToken
        );

      if (
        !commitsResponse.ok ||
        !Array.isArray(commits)
      ) {
        return res
          .status(502)
          .json({
            verified: false,

            reason:
              "Repository was found, but commit evidence could not be retrieved.",
          });
      }

      if (
        commits.length ===
        0
      ) {
        return res
          .status(400)
          .json({
            verified: false,

            reason:
              "Repository does not contain any commits.",
          });
      }

      const latestCommit =
        commits[0];

      /*
       * We intentionally do NOT generate
       * cryptographic evidence if the identity
       * and repository owner don't match.
       */

      if (!ownerMatches) {
        return res
          .status(403)
          .json({
            verified: false,

            reason:
              "Authenticated GitHub identity does not match the repository owner.",

            githubUser: {
              id:
                authenticatedUser.id,

              login:
                authenticatedUser.login,
            },

            repository: {
              id:
                repositoryData.id,

              fullName:
                repositoryData.full_name,

              owner:
                repositoryData.owner
                  ?.login,

              ownerId:
                repositoryData.owner
                  ?.id,
            },
          });
      }

      /*
       * Successful verification.
       */

      return res.json({
        verified: true,

        verification: {
          identityMatch:
            true,

          repositoryAccessible:
            true,

          repositoryOwnerVerified:
            true,

          latestCommitVerified:
            true,
        },

        githubUser: {
          id:
            authenticatedUser.id,

          login:
            authenticatedUser.login,

          name:
            authenticatedUser.name ||
            "",

          profileUrl:
            authenticatedUser.html_url ||
            "",
        },

        repository: {
          id:
            repositoryData.id,

          name:
            repositoryData.name,

          fullName:
            repositoryData.full_name,

          url:
            repositoryData.html_url,

          owner:
            repositoryData.owner
              ?.login,

          ownerId:
            repositoryData.owner
              ?.id,

          defaultBranch:
            repositoryData.default_branch,

          private:
            Boolean(
              repositoryData.private
            ),
        },

        latestCommit: {
          sha:
            latestCommit.sha,

          url:
            latestCommit.html_url,

          message:
            latestCommit.commit
              ?.message
              ?.split("\n")[0]
              ?.trim() || "",

          date:
            latestCommit.commit
              ?.author
              ?.date ||
            "",
        },
      });
    } catch (error) {
      console.error(
        "Repository verification error:",
        error
      );

      return res
        .status(500)
        .json({
          verified: false,

          reason:
            "Unexpected repository verification error.",
        });
    }
  }
);

/* =====================================================
   LOGOUT
   ===================================================== */

app.post(
  "/api/github/logout",
  (req, res) => {
    const token =
      req.headers[
        "x-github-session"
      ];

    if (
      token &&
      typeof token ===
        "string"
    ) {
      githubSessions.delete(
        token
      );
    }

    return res.json({
      success: true,
    });
  }
);

/* =====================================================
   SERVER
   ===================================================== */

app.listen(
  PORT,
  () => {
    console.log(
      `EduProof GitHub Identity Service running on http://localhost:${PORT}`
    );
  }
);