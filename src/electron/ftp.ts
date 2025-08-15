import { Client } from "basic-ftp";
import path from "path";
import { generateLog, progressStats } from "./utils.js";

type Logger = (...args: ParametersExceptFirst<typeof generateLog>) => void;

export class FtpClient {
  private readonly client: Client;
  private config: FtpConfig;
  private readonly logger?: Logger;
  private readonly onProgress?: typeof progressStats;

  constructor(
    config: FtpConfig,
    logger?: Logger,
    onProgress?: typeof progressStats
  ) {
    this.config = config;
    this.client = new Client();
    this.client.ftp.verbose = false;
    this.logger = logger;
    this.onProgress = onProgress;
    this.client.trackProgress((info) => {
      this.onProgress?.(info.name, info.bytes, info.bytesOverall);
    });
  }

  async connect() {
    await this.client.access({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      secure: false,
    });
  }

  disconnect() {
    this.client.close();
  }

  async testConnection() {
    try {
      await this.connect();
      return true;
    } catch {
      return false;
    } finally {
      this.disconnect();
    }
  }

  async getFtpTree(path: string) {
    try {
      await this.connect();

      const startPath = path || "/";

      const items = await this.client.list(startPath);

      return items
        .map((item) =>
          item.isDirectory && !item.name.startsWith(".")
            ? {
                id: `${startPath}/${item.name}`,
                name: item.name,
                children: [],
              }
            : null
        )
        .filter(Boolean) as DirectoryNode[];
    } catch {
      this.logger?.("Error crawling FTP directory", "error", {
        type: "connection",
        event: "error",
      });
      return [] as DirectoryNode[];
    } finally {
      this.disconnect();
    }
  }

  async sendFile(localPath: string) {
    try {
      await this.connect();

      const remoteFile = path.join(
        this.config.remoteDirectory,
        localPath.replace(this.config.localDirectory, "")
      );

      await this.client.uploadFrom(localPath, remoteFile);
    } catch {
      this.logger?.("Error sending file", "error", {
        type: "file",
        event: "sent",
      });
    } finally {
      this.disconnect();
    }
  }

  async deleteFile(localPath: string) {
    try {
      await this.connect();
      const remoteFile = path.join(
        this.config.remoteDirectory,
        localPath.replace(this.config.localDirectory, "")
      );
      await this.client.remove(remoteFile);
    } catch {
      this.logger?.("Error deleting file", "error", {
        type: "file",
        event: "deleted",
      });
    } finally {
      this.disconnect();
    }
  }
}
