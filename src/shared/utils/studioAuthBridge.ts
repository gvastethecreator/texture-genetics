const TILED_AUTH_MESSAGE_TYPE = "tiled:auth";
const TILED_AUTH_REQUEST_MESSAGE_TYPE = "tiled:auth-request";
const TILED_AUTH_UPDATED_EVENT = "tiled:auth-updated";
const TILED_AUTH_GLOBAL_KEY = "__TILED_AUTH__";

export interface StudioBridgeSessionUser {
  displayName: string | null;
  email: string | null;
  expiresAt: number | null;
  isAdmin: boolean;
  photoURL: string | null;
  roles: string[];
  uid: string;
}

export interface StudioBridgeSession {
  authenticated: boolean;
  user: StudioBridgeSessionUser | null;
}

export interface StudioBridgeAuthMessage {
  apiBaseUrl: string;
  runtime?: unknown;
  session: StudioBridgeSession;
  type: "tiled:auth";
}

export interface StudioBridgeState {
  apiBaseUrl: string | null;
  connected: boolean;
  receivedAt: number | null;
  runtime: unknown;
  session: StudioBridgeSession | null;
}

type StudioBridgeListener = (state: StudioBridgeState) => void;

const listeners = new Set<StudioBridgeListener>();

let currentState: StudioBridgeState = {
  apiBaseUrl: null,
  connected: false,
  receivedAt: null,
  runtime: null,
  session: null,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringOrNull = (value: unknown): value is string | null =>
  typeof value === "string" || value === null;

const isNumberOrNull = (value: unknown): value is number | null =>
  typeof value === "number" || value === null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isStudioSessionUser = (value: unknown): value is StudioBridgeSessionUser => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringOrNull(value.displayName) &&
    isStringOrNull(value.email) &&
    isNumberOrNull(value.expiresAt) &&
    typeof value.isAdmin === "boolean" &&
    isStringOrNull(value.photoURL) &&
    isStringArray(value.roles) &&
    typeof value.uid === "string"
  );
};

const isStudioSession = (value: unknown): value is StudioBridgeSession => {
  if (!isRecord(value)) {
    return false;
  }

  const user = value.user;
  return typeof value.authenticated === "boolean" && (user === null || isStudioSessionUser(user));
};

const isStudioAuthMessage = (value: unknown): value is StudioBridgeAuthMessage => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.type === TILED_AUTH_MESSAGE_TYPE &&
    typeof value.apiBaseUrl === "string" &&
    isStudioSession(value.session)
  );
};

const resolveParentOrigin = (): string | null => {
  if (typeof document === "undefined" || !document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
};

const emitBridgeUpdate = (nextState: StudioBridgeState) => {
  currentState = nextState;
  (globalThis as unknown as Record<typeof TILED_AUTH_GLOBAL_KEY, StudioBridgeState>)[
    TILED_AUTH_GLOBAL_KEY
  ] = nextState;

  for (const listener of listeners) {
    listener(nextState);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<StudioBridgeState>(TILED_AUTH_UPDATED_EVENT, {
        detail: nextState,
      }),
    );
  }
};

export const getStudioBridgeState = (): StudioBridgeState => currentState;

export const subscribeStudioBridge = (listener: StudioBridgeListener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const initStudioAuthBridge = (): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const parentOrigin = resolveParentOrigin();

  const requestAuthSnapshot = () => {
    if (!window.parent || window.parent === window) {
      return;
    }

    window.parent.postMessage({ type: TILED_AUTH_REQUEST_MESSAGE_TYPE }, parentOrigin ?? "*");
  };

  const handleMessage = (event: MessageEvent<unknown>) => {
    if (event.source !== window.parent) {
      return;
    }

    if (parentOrigin && event.origin !== parentOrigin) {
      return;
    }

    if (!isStudioAuthMessage(event.data)) {
      return;
    }

    emitBridgeUpdate({
      apiBaseUrl: event.data.apiBaseUrl,
      connected: true,
      receivedAt: Date.now(),
      runtime: event.data.runtime ?? null,
      session: event.data.session,
    });
  };

  window.addEventListener("message", handleMessage);
  requestAuthSnapshot();

  return () => {
    window.removeEventListener("message", handleMessage);
  };
};
