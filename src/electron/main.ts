import { app, BrowserWindow } from "electron";
import { v4 as uuidv4 } from "uuid";
import { getPreloadPath, getUIPath } from "./pathResolver.js";
import { ipcMainOn, isDev, ipcWebContentsSend } from "./utils.js";
import { testConnection } from "./ftp.js";

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

  ipcMainOn("testFtpConnection", async (config: FtpConfig) => {
    const result = testConnection(config);
    result.then((result) => {
      ipcWebContentsSend(
        "testFtpConnectionResult",
        mainWindow.webContents,
        result
      );
      if (result) {
        ipcWebContentsSend("log", mainWindow.webContents, {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: "info",
          message: "FTP connection successful",
        });
      } else {
        ipcWebContentsSend("log", mainWindow.webContents, {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: "error",
          message: "FTP connection failed",
        });
      }
    });
    return result;
  });
});
