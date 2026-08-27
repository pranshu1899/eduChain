export type HackathonOrganizationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface HackathonOrganizationRequest {
  id: string;

  organizationName: string;
  organizationDescription: string;

  organizerName: string;
  organizerEmail: string;

  walletAddress: string;

  website?: string;

  reason: string;

  status: HackathonOrganizationStatus;

  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}