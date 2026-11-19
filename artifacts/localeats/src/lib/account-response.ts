import type { FetchResponseEvidence } from '../../../../lib/api-client-react/src/custom-fetch';
import type { Profile } from "@workspace/api-client-react";

export type AccountAccessResponse = {
  ownerConfigured: boolean;
  ownerMatched: boolean;
  ownerDriverConfigured: boolean;
  ownerDriverMatched: boolean;
  profileStatus: "active" | "setup_required" | "suspended";
  role: string | null;
  administrator: boolean;
  superAdministrator: boolean;
  driver: boolean;
  privateStaging?: boolean;
  stagingAdmitted?: boolean;
};
const roles = ["customer", "restaurant", "driver", "admin"];
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export class AccountResponseError extends Error {
  readonly code: string;
  constructor(endpoint: "PROFILE" | "ACCESS", value: unknown, evidence?: Readonly<FetchResponseEvidence>) {
    const kind =
      value == null ? "EMPTY" : typeof value === "string" ? "TEXT" : "SHAPE";
    const code = `ACCOUNT_${endpoint}_RESPONSE_INVALID_${kind}`;
    super(
      `The server response did not contain valid account ${endpoint === "PROFILE" ? "profile" : "permissions"}. Retry, or sign out and sign in again. No permissions were changed. Code: ${code}.${evidence ? ` Transport: HTTP_${evidence.status}_${evidence.media}_STREAM_${evidence.stream}_TEXT_${evidence.textLength ?? 'UNKNOWN'}_LENGTH_${evidence.declaredLength ?? 'UNKNOWN'}${evidence.redirected ? '_REDIRECTED' : ''}.` : ''}`,
    );
    this.name = "AccountResponseError";
    this.code = code;
  }
}
export function accountProfileResponse(value: unknown, evidence?: Readonly<FetchResponseEvidence>): Profile {
  if (
    !object(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    !roles.includes(value.role as string) ||
    typeof value.displayName !== "string" ||
    !(typeof value.createdAt === "string" || value.createdAt instanceof Date) ||
    !Number.isFinite(new Date(value.createdAt).getTime())
  )
    throw new AccountResponseError("PROFILE", value, evidence);
  return value as unknown as Profile;
}
export function accountAccessResponse(value: unknown, evidence?: Readonly<FetchResponseEvidence>): AccountAccessResponse {
  const flags = [
    "ownerConfigured",
    "ownerMatched",
    "ownerDriverConfigured",
    "ownerDriverMatched",
    "administrator",
    "superAdministrator",
    "driver",
  ];
  if (
    !object(value) ||
    flags.some((flag) => typeof value[flag] !== "boolean") ||
    !["active", "setup_required", "suspended"].includes(
      value.profileStatus as string,
    ) ||
    !(value.role === null || roles.includes(value.role as string)) ||
    ["privateStaging", "stagingAdmitted"].some(
      (flag) => value[flag] !== undefined && typeof value[flag] !== "boolean",
    )
  )
    throw new AccountResponseError("ACCESS", value, evidence);
  return value as AccountAccessResponse;
}

// Keep sanitized evidence within this read; never persist response payloads.
export async function accountResponseRead<T>(
  read: (observe: (evidence: Readonly<FetchResponseEvidence>) => void) => Promise<unknown>,
  validate: (value: unknown, evidence?: Readonly<FetchResponseEvidence>) => T,
): Promise<T> {
  let evidence: Readonly<FetchResponseEvidence> | undefined;
  const value = await read(next => { evidence = next; });
  return validate(value, evidence);
}
