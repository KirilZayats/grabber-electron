import { type WebContents } from "electron";
import fs from "fs";
import { ipcMain } from "electron";
import { v4 as uuidv4 } from "uuid";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

const SOCKET_ERRNO_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ENOTFOUND",
  "EPIPE",
  "ECONNABORTED",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "EAI_AGAIN",
]);

/** True for transport / socket failures, not FTP auth or path errors. */
export function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as NodeJS.ErrnoException;
  if (typeof e.code === "string" && SOCKET_ERRNO_CODES.has(e.code)) {
    return true;
  }
  const msg =
    error instanceof Error ? error.message.toLowerCase() : String(error);
  return /connection timeout|connection reset|connection refused|econn|socket hang up|socket closed|network (?:error|unreachable)|timed out|ehostunreach|enetunreach|getaddrinfo/.test(
    msg
  );
}

export function ipcMainHandle<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: () => EventPayloadMapping[Key]
) {
  ipcMain.handle(key, () => {
    return handler();
  });
}

export function ipcMainOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  handler: (payload: EventPayloadMapping[Key]) => void
) {
  ipcMain.on(key, (_event, payload) => {
    return handler(payload);
  });
}

export function ipcWebContentsSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  webContents: WebContents,
  payload: EventPayloadMapping[Key]
) {
  webContents.send(key, payload);
}

export const validateLocalDirectory = async (path: string) => {
  const exists = await fs.promises
    .access(path)
    .then(() => true)
    .catch(() => false);
  return { path, exists };
};

export const generateLog = (
  webContents: WebContents,
  message: string,
  type: LogType,
  scope: EventScope
) => {
  const log = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    message,
    scope,
  };
  ipcWebContentsSend("log", webContents, log);
  return log;
};

export const progressStats = (
  webContents: WebContents,
  fileName: string,
  transfer: number,
  total: number
) => {
  const progress = +((transfer / total) * 100).toFixed(2);

  ipcWebContentsSend("subscribeProgress", webContents, {
    fileName,
    progress,
  });
};
