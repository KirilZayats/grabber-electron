import { Client } from "basic-ftp";
import fs from "fs";
import path from "path";
import { generateLog, progressStats } from "./utils.js";

type Logger = (...args: ParametersExceptFirst<typeof generateLog>) => void;
type Progress = (...args: ParametersExceptFirst<typeof progressStats>) => void;

export class FtpClient {
  private readonly client: Client;
  private config: FtpConfig;
  private readonly logger?: Logger;
  private readonly onProgress?: Progress;

  constructor(config: FtpConfig, logger?: Logger, onProgress?: Progress) {
    this.config = config;
    this.client = new Client();
    this.client.ftp.verbose = false;
    this.logger = logger;
    this.onProgress = onProgress;
    this.client.trackProgress((info) => {
      if (info.type !== "list") {
        const fileSizeInBytes = this.getFileSize(info.name);
        this.onProgress?.(info.name, info.bytes, fileSizeInBytes);
      }
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

  private getFileSize(remotePath: string) {
    const localPath = path.join(
      this.config.localDirectory,
      remotePath.replace(this.config.remoteDirectory, "")
    );
    console.log(this.config.remoteDirectory);
    console.log(localPath);
    if (!fs.existsSync(localPath)) {
      return 0;
    }
    const stats = fs.statSync(localPath);
    return stats.size;
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

  async getFtpTree(initPath: string) {
    try {
      await this.connect();

      const items = await this.client.list(initPath);

      return items
        .map((item) =>
          item.isDirectory && !item.name.startsWith(".")
            ? {
                id: path.join(initPath, item.name),
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
    } catch (error) {
      this.logger?.(`Error sending file: ${error}`, "error", {
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
