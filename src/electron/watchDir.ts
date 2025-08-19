import watch from "watch";
import fs from "fs";
import { FtpClient } from "./ftp.js";

class WatchDir {
  private path: string | null = null;
  private onFile:
    | ((message: string, type: LogType, scope: EventScope) => void)
    | null = null;
  private monitor: watch.Monitor | null = null;

  constructor() {}

  start(
    path: string,
    ftpClient: FtpClient,
    onFile: (message: string, type: LogType, scope: EventScope) => void
  ) {
    this.path = path;
    this.onFile = onFile;
    if (!this.path || !this.onFile) {
      throw new Error("path and onFile must be set");
    }
    this.onFile?.(`watching '${this.path}' started`, "info", {
      type: "watch",
      event: "started",
    });
    watch.createMonitor(this.path, (monitor) => {
      this.monitor = monitor;
      monitor.on("created", async (f) => {
        const type = fs.lstatSync(f).isDirectory() ? "directory" : "file";
        if (type === "file") {
          await ftpClient.sendFile(f);
        } else {
          await ftpClient.createDirectory(f);
        }

        this.onFile?.(`${type} '${f}' was created`, "info", {
          type,
          event: "created",
        });
      });
      monitor.on("changed", async (f) => {
        const type = fs.lstatSync(f).isDirectory() ? "directory" : "file";
        this.onFile?.(`${type} '${f}' was changed`, "info", {
          type,
          event: "changed",
        });

        await ftpClient.sendFile(f);
      });
      monitor.on("removed", async (f) => {
        const type = (await ftpClient.isFtpDirectory(f)) ? "directory" : "file";
        this.onFile?.(`${type} '${f}' was removed`, "info", {
          type,
          event: "removed",
        });

        if (type === "file") await ftpClient.removeFile(f);
        else await ftpClient.removeDirectory(f);
      });
    });
  }

  stop() {
    if (this.monitor) {
      this.onFile?.(`watching '${this.path}' stopped`, "info", {
        type: "watch",
        event: "stopped",
      });
      this.monitor.stop();
      this.monitor = null;
    }
  }
}

export default WatchDir;
