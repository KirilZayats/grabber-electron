import watch from "watch";

class WatchDir {
  private path: string | null = null;
  private onFile:
    | ((message: string, type: LogType, scope: EventScope) => void)
    | null = null;
  private monitor: watch.Monitor | null = null;

  constructor() {}

  start(
    path: string,
    onFile: (message: string, type: LogType, scope: EventScope) => void
  ) {
    this.path = path;
    this.onFile = onFile;
    if (!this.path || !this.onFile) {
      throw new Error("Path and onFile must be set");
    }
    watch.createMonitor(this.path, (monitor) => {
      this.monitor = monitor;
      monitor.on("created", (f, stat) => {
        this.onFile?.(`file '${f}' was created`, "info", {
          type: stat.isDirectory() ? "directory" : "file",
          event: "created",
        });
      });
      monitor.on("changed", (f, stat) => {
        const type = stat.isDirectory() ? "directory" : "file";
        this.onFile?.(`${type} '${f}' was changed`, "info", {
          type,
          event: "changed",
        });
      });
      monitor.on("removed", (f, stat) => {
        const type = stat.isDirectory() ? "directory" : "file";
        this.onFile?.(`${type} '${f}' was removed`, "info", {
          type,
          event: "removed",
        });
      });
    });
  }

  stop() {
    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }
  }
}

export default WatchDir;
