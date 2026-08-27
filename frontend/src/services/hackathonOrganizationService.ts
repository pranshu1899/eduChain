import type {
  HackathonOrganizationRequest,
} from "../types/hackathon";

/* =====================================================
   STORAGE
   ===================================================== */

const STORAGE_KEY =
  "eduproof:hackathon-organizations:v1";

/* =====================================================
   STORAGE HELPERS
   ===================================================== */

function readRequests(): HackathonOrganizationRequest[] {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed: unknown =
      JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as HackathonOrganizationRequest[];
  } catch (error) {
    console.error(
      "Unable to read hackathon organization requests:",
      error,
    );

    return [];
  }
}

function writeRequests(
  requests: HackathonOrganizationRequest[],
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(requests),
  );
}

/* =====================================================
   ID
   ===================================================== */

function generateRequestId(): string {
  return `hackathon-org-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =====================================================
   NORMALIZATION
   ===================================================== */

function normalizeRequired(
  value: string,
  fieldName: string,
): string {
  const normalized =
    value.trim();

  if (!normalized) {
    throw new Error(
      `${fieldName} is required.`,
    );
  }

  return normalized;
}

function normalizeOptional(
  value?: string,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized || undefined;
}

/* =====================================================
   CREATE REQUEST INPUT
   ===================================================== */

export interface CreateHackathonOrganizationRequestInput {
  organizationName: string;
  organizerName: string;
  organizerEmail: string;
  walletAddress: string;
  organizationDescription: string;
  reason: string;
  website?: string;
}

/* =====================================================
   CREATE APPLICATION
   ===================================================== */

export function createHackathonOrganizationRequest(
  input: CreateHackathonOrganizationRequestInput,
): HackathonOrganizationRequest {
  const organizationName =
    normalizeRequired(
      input.organizationName,
      "Organization name",
    );

  const organizerName =
    normalizeRequired(
      input.organizerName,
      "Organizer name",
    );

  const organizerEmail =
    normalizeRequired(
      input.organizerEmail,
      "Organizer email",
    );

  const walletAddress =
    normalizeRequired(
      input.walletAddress,
      "Wallet address",
    );

  const organizationDescription =
    normalizeRequired(
      input.organizationDescription,
      "Organization description",
    );

  const reason =
    normalizeRequired(
      input.reason,
      "Application reason",
    );

  const website =
    normalizeOptional(
      input.website,
    );

  const existing =
    readRequests();

  /*
   * Do not allow multiple pending
   * applications from the same wallet.
   */
  const duplicate =
    existing.find(
      (request) =>
        request.walletAddress.toLowerCase() ===
          walletAddress.toLowerCase() &&
        request.status === "PENDING",
    );

  if (duplicate) {
    throw new Error(
      "This wallet already has a pending hackathon organization application.",
    );
  }

  const now =
    Date.now();

  /*
   * IMPORTANT:
   *
   * submittedAt is the canonical timestamp
   * already defined by src/types/hackathon.ts.
   *
   * Do not introduce createdAt here.
   */
  const request: HackathonOrganizationRequest =
    {
      id:
        generateRequestId(),

      organizationName,

      organizerName,

      organizerEmail,

      walletAddress,

      organizationDescription,

      reason,

      website,

      status:
        "PENDING",

      submittedAt:
        now,
    };

  existing.unshift(
    request,
  );

  writeRequests(
    existing,
  );

  return request;
}

/* =====================================================
   GET ALL REQUESTS
   ===================================================== */

export function getHackathonOrganizationRequests(): HackathonOrganizationRequest[] {
  return readRequests();
}

/* =====================================================
   GET PENDING REQUESTS
   ===================================================== */

export function getPendingHackathonOrganizationRequests(): HackathonOrganizationRequest[] {
  return readRequests().filter(
    (request) =>
      request.status ===
      "PENDING",
  );
}

/* =====================================================
   GET APPROVED ORGANIZATIONS
   ===================================================== */

export function getApprovedHackathonOrganizations(): HackathonOrganizationRequest[] {
  return readRequests().filter(
    (request) =>
      request.status ===
      "APPROVED",
  );
}

/* =====================================================
   GET REQUEST BY ID
   ===================================================== */

export function getHackathonOrganizationRequestById(
  id: string,
): HackathonOrganizationRequest | null {
  return (
    readRequests().find(
      (request) =>
        request.id === id,
    ) ?? null
  );
}

/* =====================================================
   GET BY WALLET
   ===================================================== */

export function getHackathonOrganizationByWallet(
  walletAddress: string,
): HackathonOrganizationRequest | null {
  const normalized =
    walletAddress
      .trim()
      .toLowerCase();

  return (
    readRequests().find(
      (request) =>
        request.walletAddress
          .toLowerCase() ===
        normalized,
    ) ?? null
  );
}

/* =====================================================
   CHECK AUTHORIZATION
   ===================================================== */

export function isHackathonOrganizationApproved(
  walletAddress: string,
): boolean {
  const organization =
    getHackathonOrganizationByWallet(
      walletAddress,
    );

  return (
    organization?.status ===
    "APPROVED"
  );
}

/* =====================================================
   APPROVE REQUEST
   ===================================================== */

export function approveHackathonOrganizationRequest(
  requestId: string,
  adminWallet: string,
): HackathonOrganizationRequest {
  const requests =
    readRequests();

  const index =
    requests.findIndex(
      (request) =>
        request.id ===
        requestId,
    );

  if (index === -1) {
    throw new Error(
      "Hackathon organization application not found.",
    );
  }

  const request =
    requests[index];

  if (
    request.status !==
    "PENDING"
  ) {
    throw new Error(
      `This application is already ${request.status.toLowerCase()}.`,
    );
  }

  const normalizedAdmin =
    adminWallet.trim();

  if (!normalizedAdmin) {
    throw new Error(
      "Admin wallet is required.",
    );
  }

  /*
   * The existing shared type controls the
   * request structure. We only update fields
   * that actually exist on that type.
   *
   * If the type only supports PENDING /
   * APPROVED / REJECTED + submittedAt,
   * approval remains represented by status.
   */
  const updated: HackathonOrganizationRequest =
    {
      ...request,
      status:
        "APPROVED",
    };

  requests[index] =
    updated;

  writeRequests(
    requests,
  );

  return updated;
}

/* =====================================================
   REJECT REQUEST
   ===================================================== */

export function rejectHackathonOrganizationRequest(
  requestId: string,
  adminWallet: string,
): HackathonOrganizationRequest {
  const requests =
    readRequests();

  const index =
    requests.findIndex(
      (request) =>
        request.id ===
        requestId,
    );

  if (index === -1) {
    throw new Error(
      "Hackathon organization application not found.",
    );
  }

  const request =
    requests[index];

  if (
    request.status !==
    "PENDING"
  ) {
    throw new Error(
      `This application is already ${request.status.toLowerCase()}.`,
    );
  }

  const normalizedAdmin =
    adminWallet.trim();

  if (!normalizedAdmin) {
    throw new Error(
      "Admin wallet is required.",
    );
  }

  const updated: HackathonOrganizationRequest =
    {
      ...request,
      status:
        "REJECTED",
    };

  requests[index] =
    updated;

  writeRequests(
    requests,
  );

  return updated;
}

/* =====================================================
   CLEAR REQUESTS
   ===================================================== */

export function clearHackathonOrganizationRequests(): void {
  localStorage.removeItem(
    STORAGE_KEY,
  );
}