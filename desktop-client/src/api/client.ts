export const API_BASE_URL =
  import.meta.env.VITE_EASY_SEND_API_BASE_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const requestUrl = `${API_BASE_URL}${path}`;
  let response: Response;

  try {
    response = await fetch(requestUrl, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new ApiError(
      "NETWORK_ERROR",
      `Cannot reach backend: ${requestUrl}. ${error instanceof Error ? error.message : "Unknown network error."}`,
      0,
    );
  }

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? ((await response.json().catch(() => null)) as
      | { error?: { code?: string; message?: string } }
      | null)
      : null;

    if (!payload) {
      const text = await response.text().catch(() => "");
      const looksLikeHtml = /<!doctype html>|<html/i.test(text);

      throw new ApiError(
        "NON_JSON_RESPONSE",
        looksLikeHtml
          ? `Backend URL seems incorrect: ${requestUrl} returned an HTML page instead of API JSON. Check VITE_EASY_SEND_API_BASE_URL and make sure server-admin is running on that port.`
          : `Backend returned ${response.status} for ${requestUrl}.`,
        response.status,
      );
    }

    throw new ApiError(
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? `Request failed: ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}
