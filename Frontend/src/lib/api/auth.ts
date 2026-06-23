import { apiPost, apiGet, setTokens, BASE_URL } from './client';
import { mapMemberToUser } from './mappers';
import type { User } from '@/shared/types';

interface TokenResponse {
  access: string;
  refresh: string;
}

interface RefreshResponse {
  access: string;
}

interface OnboardPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  orgName: string;
  orgSlug: string;
}

/**
 * Authenticate with username/email and password.
 * Stores the returned tokens in localStorage and returns them.
 */
export async function loginApi(
  username: string,
  password: string,
): Promise<TokenResponse> {
  const data = await apiPost<TokenResponse>('/api/auth/token/', {
    username,
    password,
  });
  setTokens(data.access, data.refresh);
  return data;
}

/**
 * Register a new organization, admin user, and tenant.
 * Does NOT automatically log the user in — the caller should call loginApi separately.
 */
export async function registerApi(
  payload: OnboardPayload,
): Promise<Record<string, unknown>> {
  return apiPost<Record<string, unknown>>('/api/onboard/', payload);
}

/**
 * Refresh the access token using the provided refresh token.
 * Stores the new access token in localStorage.
 */
export async function refreshTokenApi(
  refresh: string,
): Promise<RefreshResponse> {
  const data = await apiPost<RefreshResponse>('/api/auth/token/refresh/', {
    refresh,
  });
  setTokens(data.access);
  return data;
}

/**
 * Decode a JWT access token to extract the payload.
 */
function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const payload = atob(token.split('.')[1]);
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Fetch the current member (User) by:
 * 1. Decoding the user_id from the access token.
 * 2. Fetching all members from /api/members/.
 * 3. Finding the member whose `user` field matches the user_id.
 * 4. Mapping it to the frontend User type.
 */
export async function getCurrentMember(): Promise<User | null> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('taskflow-access-token')
      : null;

  if (!token) return null;

  const payload = decodeToken(token);
  if (!payload) return null;

  // SimpleJWT serialises the user id claim as a string; the members API
  // returns it as a number, so compare both coerced to Number.
  const userId = Number(payload.user_id);
  if (!Number.isFinite(userId)) return null;

  try {
    const members =
      await apiGet<Record<string, unknown>[]>('/api/members/');

    // The API might return a paginated response or a flat array
    const memberList = Array.isArray(members)
      ? members
      : ((members as Record<string, unknown>).results as Record<string, unknown>[]) ?? [];

    const matched = memberList.find(
      (m: Record<string, unknown>) => Number(m.user) === userId,
    );

    if (!matched) return null;

    return mapMemberToUser(matched);
  } catch {
    return null;
  }
}
