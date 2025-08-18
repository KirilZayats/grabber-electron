import { Client, FTPError } from "basic-ftp";
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
    this.client.ftp.verbose = true;
    this.logger = logger;
    this.onProgress = onProgress;
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
    console.log(remotePath);
    const localPath = path.join(
      this.config.localDirectory,
      remotePath.replace(this.config.remoteDirectory, "")
    );
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
      this.client.trackProgress((info) => {
        this.onProgress?.(info.name, info.bytes, info.bytesOverall);
      });

      const subtrFilename = localPath.replace(this.config.localDirectory, "");
      const dirs = path.dirname(subtrFilename);
      await this.client.ensureDir(path.join(this.config.remoteDirectory, dirs));

      await this.client.uploadFrom(localPath, path.basename(subtrFilename));
    } catch (error) {
      this.logger?.(`Error sending file: ${error}`, "error", {
        type: "file",
        event: "sent",
      });
    } finally {
      this.disconnect();
      this.client.trackProgress();
    }
  }

  async removeFile(localPath: string) {
    try {
      await this.connect();
      const remoteFile = path.join(
        this.config.remoteDirectory,
        localPath.replace(this.config.localDirectory, "")
      );

      await this.client.remove(remoteFile);
    } catch (error) {
      this.logger?.(`Error deleting file: ${error}`, "error", {
        type: "file",
        event: "deleted",
      });
    } finally {
      this.disconnect();
    }
  }

  async createDirectory(localPath: string) {
    try {
      await this.connect();

      this.client.trackProgress((info) => {
        this.onProgress?.(info.name, info.bytes, info.bytesOverall);
      });
      await this.client.ensureDir(localPath);
      await this.client.uploadFromDir(localPath);
    } catch (error) {
      this.logger?.(`Error creating directory: ${error}`, "error", {
        type: "directory",
        event: "created",
      });
    } finally {
      this.disconnect();
      this.client.trackProgress();
    }
  }

  async removeDirectory(remotePath: string) {
    try {
      await this.connect();
      await this.client.removeDir(remotePath);
    } catch (error: unknown) {
      if (error instanceof FTPError && error.code !== 550)
        this.logger?.(`Error removing directory: ${error}`, "error", {
          type: "directory",
          event: "removed",
        });
    } finally {
      this.disconnect();
    }
  }
}
