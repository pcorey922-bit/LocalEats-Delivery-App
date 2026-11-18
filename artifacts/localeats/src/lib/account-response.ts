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
  constructor(endpoint: "PROFILE" | "ACCESS", value: unknown) {
    const kind =
      value == null ? "EMPTY" : typeof value === "string" ? "TEXT" : "SHAPE";
    const code = `ACCOUNT_${endpoint}_RESPONSE_INVALID_${kind}`;
    super(
      `The server response did not contain valid account ${endpoint === "PROFILE" ? "profile" : "permissions"}. Retry, or sign out and sign in again. No permissions were changed. Code: ${code}.`,
    );
    this.name = "AccountResponseError";
    this.code = code;
  }
}
export function accountProfileResponse(value: unknown): Profile {
  if (
    !object(value) ||
    typeof value.id !== "string" ||
    !value.id ||
    !roles.includes(value.role as string) ||
    typeof value.displayName !== "string" ||
    !(typeof value.createdAt === "string" || value.createdAt instanceof Date) ||
    !Number.isFinite(new Date(value.createdAt).getTime())
  )
    throw new AccountResponseError("PROFILE", value);
  return value as unknown as Profile;
}
export function accountAccessResponse(value: unknown): AccountAccessResponse {
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
    throw new AccountResponseError("ACCESS", value);
  return value as AccountAccessResponse;
}
