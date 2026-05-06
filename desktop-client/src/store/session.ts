export type SessionState = {
  token: string | null;
  email: string | null;
  deviceName: string | null;
};

const SESSION_STORAGE_KEY = "vercelsend.desktop.session";
const DEVICE_NAME_STORAGE_KEY = "vercelsend.desktop.device-name";

export const initialSessionState: SessionState = {
  token: null,
  email: null,
  deviceName: null,
};

export function readSessionState(): SessionState {
  if (typeof window === "undefined") {
    return initialSessionState;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return initialSessionState;
    const parsed = JSON.parse(raw) as SessionState;
    return {
      token: parsed.token ?? null,
      email: parsed.email ?? null,
      deviceName: parsed.deviceName ?? null,
    };
  } catch {
    return initialSessionState;
  }
}

export function writeSessionState(session: SessionState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearSessionState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function readLocalDeviceName(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(DEVICE_NAME_STORAGE_KEY);
  return value?.trim() ? value : null;
}

export function writeLocalDeviceName(deviceName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICE_NAME_STORAGE_KEY, deviceName);
}

export function readOrCreateLocalDeviceName(factory: () => string) {
  const existing = readLocalDeviceName();
  if (existing) {
    return existing;
  }

  const created = factory();
  writeLocalDeviceName(created);
  return created;
}
