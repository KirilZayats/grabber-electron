import { Client, FTPError } from "basic-ftp";
import fs from "fs";
import path from "path";
import { generateLog, progressStats } from "./utils.js";

type Logger = (...args: ParametersExceptFirst<typeof generateLog>) => void;
type Progress = (...args: ParametersExceptFirst<typeof progressStats>) => void;

export class FtpClient {
  private config: FtpConfig;
  private readonly logger?: Logger;
  private readonly onProgress?: Progress;

  constructor(config: FtpConfig, logger?: Logger, onProgress?: Progress) {
    this.config = config;
    this.logger = logger;
    this.onProgress = onProgress;
  }

  static async isServerAvailable(host: string, port: number) {
    const client = new Client();
    try {
      await client.connect(host, port);
      return true;
    } catch {
      return false;
    } finally {
      client.close();
    }
  }

  async connect() {
    const client = new Client();
    await client.access({
      host: this.config.host,
      port: this.config.port,
      user: this.config.username,
      password: this.config.password,
      secure: false,
    });
    return client;
  }

  disconnect(client?: Client) {
    client?.close();
  }

  private getFileSize(localPath: string) {
    if (!fs.existsSync(localPath)) {
      return 0;
    }
    const stats = fs.statSync(localPath);
    return stats.size;
  }

  async testConnection() {
    let client: Client | undefined;
    try {
      client = await this.connect();
      return true;
    } catch {
      return false;
    } finally {
      this.disconnect(client);
    }
  }

  async validateRemoteDirectory() {
    const client = await this.connect();
    try {
      await client.cd(this.config.remoteDirectory);
      return true;
    } catch {
      return false;
    } finally {
      this.disconnect(client);
    }
  }

  async getFtpTree(initPath: string) {
    const client = await this.connect();
    try {
      const items = await client.list(initPath);

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
      this.disconnect(client);
    }
  }

  async sendFile(localPath: string) {
    const client = await this.connect();
    try {
      client.trackProgress((info) => {
        this.onProgress?.(info.name, info.bytes, this.getFileSize(localPath));
      });
      const subtrFilename = localPath.replace(this.config.localDirectory, "");
      const dirs = path.dirname(subtrFilename);
      await client.ensureDir(path.join(this.config.remoteDirectory, dirs));

      await client.cd(this.config.remoteDirectory);
      await client.uploadFrom(
        localPath,
        path.join(this.config.remoteDirectory, subtrFilename)
      );
    } catch (error) {
      this.logger?.(`Error sending file: ${error}`, "error", {
        type: "file",
        event: "sent",
      });
    } finally {
      this.disconnect();
      client.trackProgress();
    }
  }

  async removeFile(localPath: string) {
    const client = await this.connect();
    try {
      const remoteFile = path.join(
        this.config.remoteDirectory,
        localPath.replace(this.config.localDirectory, "")
      );

      await client.remove(remoteFile);
    } catch (error) {
      this.logger?.(`Error deleting file: ${error}`, "error", {
        type: "file",
        event: "deleted",
      });
    } finally {
      this.disconnect(client);
    }
  }

  async createDirectory(localPath: string) {
    const client = await this.connect();
    try {
      client.trackProgress((info) => {
        this.onProgress?.(
          info.name,
          info.bytes,
          this.getFileSize(path.join(localPath, info.name))
        );
      });
      const subtrFilename = localPath.replace(this.config.localDirectory, "");
      const remoteDir = path.dirname(subtrFilename);
      await client.ensureDir(remoteDir);
      await client.cd(this.config.remoteDirectory);
      await client.uploadFromDir(localPath, remoteDir);
    } catch (error) {
      this.logger?.(`Error creating directory: ${error}`, "error", {
        type: "directory",
        event: "created",
      });
    } finally {
      this.disconnect(client);
      client.trackProgress();
    }
  }

  async removeDirectory(remotePath: string) {
    const client = await this.connect();
    try {
      await client.removeDir(remotePath);
    } catch (error: unknown) {
      if (error instanceof FTPError && error.code !== 550)
        this.logger?.(`Error removing directory: ${error}`, "error", {
          type: "directory",
          event: "removed",
        });
    } finally {
      this.disconnect(client);
    }
  }
}
