import { app, BrowserWindow, dialog, Tray, Menu, nativeImage } from "electron";
import { fileURLToPath } from "node:url";
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
import { SyncRecovery, type OutageStorage } from "./syncRecovery.js";
import WatchDir from "./watchDir.js";
import path from "path";

storage.setDataPath(path.join(app.getPath("userData"), "grabber"));

function loadTrayIcon() {
  const mainDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(mainDir, "..", "desktopIcon.png"),
    path.join(app.getAppPath(), "desktopIcon.png"),
  ];
  for (const p of candidates) {
    const img = nativeImage.createFromPath(p);
    if (!img.isEmpty()) {
      return img;
    }
  }
  return nativeImage.createEmpty();
}

app.on("ready", () => {
  let allowQuit = false;

  const mainWindow = new BrowserWindow({
    webPreferences: {
      preload: getPreloadPath(),
    },
    maximizable: true,
    minWidth: 1000,
    minHeight: 600,
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123");
  } else {
    mainWindow.loadFile(getUIPath());
    mainWindow.setMenu(null);
  }

  const trayIcon = loadTrayIcon();
  const tray = new Tray(trayIcon);
  tray.setToolTip(app.getName());

  const showMainWindow = () => {
    mainWindow.show();
    mainWindow.focus();
  };

  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show", click: () => showMainWindow() },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          allowQuit = true;
          app.quit();
        },
      },
    ])
  );

  tray.on("click", () => showMainWindow());

  mainWindow.on("close", (e) => {
    if (!allowQuit) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  app.on("before-quit", () => {
    allowQuit = true;
  });

  app.on("will-quit", () => {
    tray.destroy();
  });

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

  ipcMainOn("testFtpConnection", async ({ payload, isSchemeTest }) => {
    const ftpClient = new FtpClient(payload);
    try {
      const result = await ftpClient.testConnection();
      ipcWebContentsSend(
        "testFtpConnectionResult",
        mainWindow.webContents,
        result
      );

      if (!isSchemeTest) {
        const event = result ? "success" : "error";
        logger(
          result ? "FTP connection successful" : "FTP connection failed",
          result ? "info" : "error",
          {
            type: "connection",
            event,
          }
        );
      }
      return result;
    } catch (error) {
      ipcWebContentsSend(
        "testFtpConnectionResult",
        mainWindow.webContents,
        false
      );
      logger(
        `FTP connection failed: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
        "error",
        {
          type: "connection",
          event: "error",
        }
      );
      return false;
    }
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

  ipcMainOn("validateLocalDirectory", async (payload) => {
    const result = await validateLocalDirectory(payload);
    ipcWebContentsSend(
      "validateLocalDirectoryResult",
      mainWindow.webContents,
      result
    );
  });

  ipcMainOn("validateRemoteDirectory", async (payload) => {
    try {
      const ftpClient = new FtpClient(payload);
      const result = await ftpClient.validateRemoteDirectory();
      ipcWebContentsSend(
        "validateRemoteDirectoryResult",
        mainWindow.webContents,
        { path: payload.remoteDirectory, exists: result }
      );
    } catch {
      ipcWebContentsSend(
        "validateRemoteDirectoryResult",
        mainWindow.webContents,
        { path: payload.remoteDirectory, exists: false }
      );
    }
  });

  ipcMainOn("startWatching", async (payload: FtpConfig) => {
    const syncRecovery = new SyncRecovery(
      storage as unknown as OutageStorage,
      payload.localDirectory,
      logger
    );
    const ftpClientHolder: { client?: FtpClient } = {};
    const ftpClient = new FtpClient(payload, logger, progress, {
      onTransferSuccess: () =>
        syncRecovery.onSuccessfulTransfer(ftpClientHolder.client!),
      onConnectionFailure: () => syncRecovery.markOutageIfNeeded(),
    });
    ftpClientHolder.client = ftpClient;
    watchDir.start(payload.localDirectory, ftpClient, logger);
  });

  ipcMainOn("stopWatching", async () => {
    watchDir.stop();
  });

  ipcMainOn("getFtpTree", async (payload: FtpConfig & { path?: string }) => {
    try {
      const ftpClient = new FtpClient(payload, logger);
      const result = await ftpClient.getFtpTree(payload.path || "");
      ipcWebContentsSend("getFtpTreeResult", mainWindow.webContents, result);
    } catch {
      ipcWebContentsSend("getFtpTreeResult", mainWindow.webContents, []);
    }
  });

  ipcMainHandle("getLogs", () => {
    const logs: Log[] = [];
    storage.getAll(function (_, data) {
      Object.values(data).forEach((log) => {
        ipcWebContentsSend(
          "log",
          mainWindow.webContents,
          Object.values(log)[0] as Log
        );
      });
    });
    return logs;
  });

  ipcMainOn("validateHost", async ({ host, port }) => {
    try {
      const result = await FtpClient.isServerAvailable(host, port);
      ipcWebContentsSend("validateHostResult", mainWindow.webContents, result);
    } catch {
      ipcWebContentsSend("validateHostResult", mainWindow.webContents, false);
    }
  });
});
