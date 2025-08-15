import { app, BrowserWindow, dialog } from "electron";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import {
  ipcMainOn,
  isDev,
  ipcWebContentsSend,
  validateLocalDirectory,
  generateLog,
} from "./utils.js";
import { testConnection } from "./ftp.js";
import WatchDir from "./watchDir.js";

app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
  }
  const watchDir = new WatchDir();

  ipcMainOn("testFtpConnection", async (config: FtpConfig) => {
    const result = testConnection(config);
    result.then((result) => {
      ipcWebContentsSend(
        "testFtpConnectionResult",
        mainWindow.webContents,
        result
      );

      const event = result ? "success" : "error";
      generateLog(
        mainWindow.webContents,
        result ? "FTP connection successful" : "FTP connection failed",
        result ? "info" : "error",
        {
          type: "connection",
          event,
        }
      );
    });
    return result;
  });

  ipcMainOn("selectLocalDirectory", async () => {
    const dir = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    ipcWebContentsSend(
      "selectLocalDirectoryResult",
      mainWindow.webContents,
      dir.filePaths[0]
    );
  });

  ipcMainOn("validateLocalDirectory", async (payload: string) => {
    const result = await validateLocalDirectory(payload);
    ipcWebContentsSend(
      "validateLocalDirectoryResult",
      mainWindow.webContents,
      result
    );
  });

  ipcMainOn("startWatching", async (payload: FtpConfig) => {
    watchDir.start(payload.localDirectory, (message, type, scope) => {
      generateLog(mainWindow.webContents, message, type, scope);
    });
  });

  ipcMainOn("stopWatching", async () => {
    watchDir.stop();
  });
});
