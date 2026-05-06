import { apiFetch } from "@/api/client";

export type AuthResponse = {
  success: true;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      role: string;
    };
    device: {
      id: string;
      deviceType: string;
      deviceName: string;
    };
  };
};

export type MeResponse = {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      role: string;
      status: string;
    };
    device: {
      id: string;
      deviceType: string;
      deviceName: string;
    };
  };
};

export type QuotaResponse = {
  success: true;
  data: {
    limits: {
      maxFileSizeMb: number;
      maxTotalFileBytes: number;
      maxTotalTextBytes: number;
      fileRetentionDays: number;
      textRetentionDays: number | null;
      secretModeEnabled: boolean;
    };
    usage: {
      fileBytesUsed: number;
      textBytesUsed: number;
    };
  };
};

type AuthPayload = {
  email: string;
  password: string;
  deviceType: string;
  deviceName: string;
};

export function register(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: AuthPayload) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout(token: string, logoutAll = false) {
  return apiFetch<{ success: true; data: { loggedOut: boolean } }>(
    "/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ logoutAll }),
    },
    token,
  );
}

export function getMe(token: string) {
  return apiFetch<MeResponse>("/me", undefined, token);
}

export function getQuota(token: string) {
  return apiFetch<QuotaResponse>("/me/quota", undefined, token);
}
