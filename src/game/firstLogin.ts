export const FIRST_LOGIN_KEY = "keyline-first-login-v1";

export type FirstLoginRecord = {
  guest?: boolean;
  seen?: boolean;
};

export function isDismissed(record: FirstLoginRecord | null | undefined): boolean {
  return Boolean(record?.guest || record?.seen);
}

export function shouldPromptFirstLogin(opts: {
  authEnabled: boolean;
  isPending: boolean;
  hasUser: boolean;
  hydrated: boolean;
  dismissed: boolean;
}): boolean {
  if (!opts.authEnabled) return false;
  if (!opts.hydrated || opts.isPending) return false;
  if (opts.hasUser) return false;
  if (opts.dismissed) return false;
  return true;
}

export function readFirstLogin(storage?: Pick<Storage, "getItem"> | null): FirstLoginRecord | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(FIRST_LOGIN_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as FirstLoginRecord;
    if (!data || typeof data !== "object") return null;
    return data;
  } catch {
    return null;
  }
}

export function writeFirstLogin(
  patch: FirstLoginRecord,
  storage?: Pick<Storage, "getItem" | "setItem"> | null,
): FirstLoginRecord | null {
  if (!storage) return null;
  const next = { ...readFirstLogin(storage), ...patch };
  try {
    storage.setItem(FIRST_LOGIN_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  return next;
}

export function browserStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
