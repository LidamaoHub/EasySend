export type SessionState = {
  token: string | null;
  email: string | null;
};

export const initialSessionState: SessionState = {
  token: null,
  email: null,
};
