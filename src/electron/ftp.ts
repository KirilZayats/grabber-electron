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

  static async isServerAvailable(
    host: string,
    port: number,
    timeout: number = 3000
  ) {
    const client = new Client();
    client.ftp.verbose = false;

    // Set timeout for the connection
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), timeout);
    });

    const connectPromise = (async () => {
      try {
        await client.connect(host, port);
        return true;
      } catch {
        return false;
      } finally {
        client.close();
      }
    })();

    try {
      return await Promise.race([connectPromise, timeoutPromise]);
    } catch {
      return false;
    }
  }

  async connect(timeout: number = 10000) {
    const client = new Client();

    // Set timeout for connection
    const timeoutPromise = new Promise<Client>((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout")), timeout);
    });

    const connectPromise = client
      .access({
        host: this.config.host,
        port: this.config.port,
        user: this.config.username,
        password: this.config.password,
        secure: false,
      })
      .then(() => client);

    return await Promise.race([connectPromise, timeoutPromise]);
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
    let client: Client | undefined;
    try {
      client = await this.connect();
      await client.cd(this.config.remoteDirectory);
      return true;
    } catch (error) {
      this.logger?.(
        `Remote directory validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        {
          type: "connection",
          event: "error",
        }
      );
      return false;
    } finally {
      this.disconnect(client);
    }
  }

  async getFtpTree(initPath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
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
    } catch (error) {
      this.logger?.(
        `Error crawling FTP directory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        {
          type: "connection",
          event: "error",
        }
      );
      return [] as DirectoryNode[];
    } finally {
      this.disconnect(client);
    }
  }

  async sendFile(localPath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
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
      this.logger?.(
        `Error sending file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        {
          type: "file",
          event: "sent",
        }
      );
    } finally {
      if (client) {
        client.trackProgress();
        this.disconnect(client);
      }
    }
  }

  async removeFile(localPath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
      const remoteFile = path.join(
        this.config.remoteDirectory,
        localPath.replace(this.config.localDirectory, "")
      );

      await client.remove(remoteFile);
    } catch (error) {
      this.logger?.(
        `Error deleting file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        {
          type: "file",
          event: "deleted",
        }
      );
    } finally {
      this.disconnect(client);
    }
  }

  async createDirectory(localPath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
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
      this.logger?.(
        `Error creating directory: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
        {
          type: "directory",
          event: "created",
        }
      );
    } finally {
      if (client) {
        client.trackProgress();
        this.disconnect(client);
      }
    }
  }

  async removeDirectory(remotePath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
      await client.removeDir(remotePath);
    } catch (error: unknown) {
      if (error instanceof FTPError && error.code !== 550) {
        this.logger?.(`Error removing directory: ${error.message}`, "error", {
          type: "directory",
          event: "removed",
        });
      }
    } finally {
      this.disconnect(client);
    }
  }
}
