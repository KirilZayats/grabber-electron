const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  subscribeLogs: (callback) => ipcOn("log", callback),
  testFtpConnection: (payload) => ipcSend("testFtpConnection", payload),
  testFtpConnectionResult: (callback) =>
    ipcOn("testFtpConnectionResult", callback),
  selectLocalDirectory: () => ipcSend("selectLocalDirectory", undefined),
  selectLocalDirectoryResult: (callback) =>
    ipcOn("selectLocalDirectoryResult", callback),
  validateLocalDirectory: (payload) =>
    ipcSend("validateLocalDirectory", payload),
  validateLocalDirectoryResult: (callback) =>
    ipcOn("validateLocalDirectoryResult", callback),
  validateRemoteDirectory: (payload) =>
    ipcSend("validateRemoteDirectory", payload),
  validateRemoteDirectoryResult: (callback) =>
    ipcOn("validateRemoteDirectoryResult", callback),
  startWatching: (payload) => ipcSend("startWatching", payload),
  stopWatching: () => ipcSend("stopWatching", undefined),
  getFtpTree: (payload) => ipcSend("getFtpTree", payload),
  getFtpTreeResult: (callback) => ipcOn("getFtpTreeResult", callback),
  subscribeProgress: (callback) => ipcOn("subscribeProgress", callback),
  getLogs: () => ipcInvoke("getLogs"),
} satisfies Window["electron"]);

function ipcInvoke<Key extends keyof EventPayloadMapping>(
  key: Key
): Promise<EventPayloadMapping[Key]> {
  return electron.ipcRenderer.invoke(key);
}

function ipcOn<Key extends keyof EventPayloadMapping>(
  key: Key,
  callback: (payload: EventPayloadMapping[Key]) => void
) {
  const cb = (_: Electron.IpcRendererEvent, payload: any) => callback(payload);
  electron.ipcRenderer.on(key, cb);
  return () => electron.ipcRenderer.off(key, cb);
}

function ipcSend<Key extends keyof EventPayloadMapping>(
  key: Key,
  payload: EventPayloadMapping[Key]
) {
  electron.ipcRenderer.send(key, payload);
}
