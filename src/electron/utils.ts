import { WebContents } from "electron";
import fs from "fs";
import { ipcMain } from "electron";
import { v4 as uuidv4 } from "uuid";

export function isDev(): boolean {
  return process.env.NODE_ENV === "development";
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
  ipcWebContentsSend("log", webContents, {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    type,
    message,
    scope,
  });
};
