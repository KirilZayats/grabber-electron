import { app, BrowserWindow, dialog } from "electron";
import storage from "electron-json-storage";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import {
  ipcMainOn,
  isDev,
  ipcWebContentsSend,
  validateLocalDirectory,
  generateLog,
  progressStats,
  ipcMainHandle,
} from "./utils.js";
import { FtpClient } from "./ftp.js";
import WatchDir from "./watchDir.js";
import path from "path";

storage.setDataPath(path.join(app.getPath("userData"), "grabber"));

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
  const logger = (message: string, type: LogType, scope: EventScope) => {
    const log = generateLog(mainWindow.webContents, message, type, scope);
    storage.set(log.timestamp, log, (err) => {
      if (err) {
        console.error(err);
      }
    });
  };
  const progress = (fileName: string, transfer: number, total: number) => {
    progressStats(mainWindow.webContents, fileName, transfer, total);
  };

  ipcMainOn("testFtpConnection", async (config: FtpConfig) => {
    const ftpClient = new FtpClient(config);
    const result = ftpClient.testConnection();
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
    const ftpClient = new FtpClient(payload, logger, progress);
    watchDir.start(payload.localDirectory, ftpClient, logger);
  });

  ipcMainOn("stopWatching", async () => {
    watchDir.stop();
  });

  ipcMainOn("getFtpTree", async (payload: FtpConfig & { path?: string }) => {
    const ftpClient = new FtpClient(payload, logger);
    const result = await ftpClient.getFtpTree(payload.path || "");
    ipcWebContentsSend("getFtpTreeResult", mainWindow.webContents, result);
  });

  ipcMainHandle("getLogs", () => {
    const logs: Log[] = [];
    storage.getAll(function (error, data) {
      if (error) {
        console.error(error);
      }

      Object.values(data).forEach((log) => {
        ipcWebContentsSend("log", mainWindow.webContents, Object.values(log)[0] as Log);
      });
    });
    return logs;
  });
});
