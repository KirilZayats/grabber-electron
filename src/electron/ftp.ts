import { Client, FTPError } from "basic-ftp";
import fs from "fs";
import path from "path";
import { generateLog, progressStats, isConnectionError } from "./utils.js";

type Logger = (...args: ParametersExceptFirst<typeof generateLog>) => void;
type Progress = (...args: ParametersExceptFirst<typeof progressStats>) => void;

export type FtpTransferHooks = {
  onTransferSuccess?: () => void | Promise<void>;
  onConnectionFailure?: () => void | Promise<void>;
};

function isFtpConnectionClosed(error: unknown): boolean {
  if (!(error instanceof FTPError)) {
    return false;
  }
  const c = Number(error.code);
  return c === 421 || c === 426;
}

function isTransportFailure(error: unknown): boolean {
  return isConnectionError(error) || isFtpConnectionClosed(error);
}

export class FtpClient {
  private config: FtpConfig;
  private readonly logger?: Logger;
  private readonly onProgress?: Progress;
  private readonly transferHooks?: FtpTransferHooks;

  constructor(
    config: FtpConfig,
    logger?: Logger,
    onProgress?: Progress,
    transferHooks?: FtpTransferHooks
  ) {
    const remoteDirectory = config.remoteDirectory.replace(/\\/g, "/");
    this.config = { ...config, remoteDirectory };
    this.logger = logger;
    this.onProgress = onProgress;
    this.transferHooks = transferHooks;
  }

  static async isServerAvailable(
    host: string,
    port: number,
    timeout: number = 3000
  ) {
    const client = new Client();
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("connection timeout")), timeout);
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
      setTimeout(() => reject(new Error("connection timeout")), timeout);
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

  private __getFileSize(localPath: string) {
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
        `remote directory validation failed: ${
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

  async isFtpDirectory(localPath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
      await client.cd(this.__getRemotePath(localPath));
      return true;
    } catch {
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
                id: path.join(initPath, item.name).replace(/\\/g, "/"),
                name: item.name,
                children: [],
              }
            : null
        )
        .filter(Boolean) as DirectoryNode[];
    } catch (error) {
      this.logger?.(
        `error crawling FTP directory: ${
          error instanceof Error ? error.message : "unknown error"
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

  async sendFile(localPath: string): Promise<boolean> {
    let client: Client | undefined;
    try {
      client = await this.connect();
      client.trackProgress((info) => {
        this.onProgress?.(
          path.basename(info.name),
          info.bytes,
          this.__getFileSize(localPath)
        );
      });
      const subtrFilename = localPath.replace(this.config.localDirectory, "");
      const dirs = path.dirname(subtrFilename);
      await client.ensureDir(path.join(this.config.remoteDirectory, dirs));

      await client.cd(this.config.remoteDirectory);
      await client.uploadFrom(
        localPath,
        path
          .join(this.config.remoteDirectory, subtrFilename)
          .replace(/\\/g, "/")
      );
      await Promise.resolve(this.transferHooks?.onTransferSuccess?.());
      return true;
    } catch (error) {
      this.logger?.(
        `error sending file: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
        "error",
        {
          type: "file",
          event: "sent",
        }
      );
      if (isTransportFailure(error)) {
        await Promise.resolve(this.transferHooks?.onConnectionFailure?.());
      }
      return false;
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
      const remoteFile = this.__getRemotePath(localPath);
      await client.remove(remoteFile);
    } catch (error) {
      this.logger?.(
        `error deleting file: ${
          error instanceof Error ? error.message : "unknown error"
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

  async createDirectory(localpath: string): Promise<boolean> {
    let client: Client | undefined;
    try {
      client = await this.connect();
      client.trackProgress((info) => {
        this.onProgress?.(
          info.name,
          info.bytes,
          this.__getFileSize(path.join(localpath, info.name))
        );
      });
      const remoteDir = this.__getRemotePath(localpath);

      await client.ensureDir(remoteDir);
      await client.cd(this.config.remoteDirectory);
      await client.uploadFromDir(localpath, remoteDir);
      await Promise.resolve(this.transferHooks?.onTransferSuccess?.());
      return true;
    } catch (error) {
      this.logger?.(
        `error creating directory: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
        "error",
        {
          type: "directory",
          event: "created",
        }
      );
      if (isTransportFailure(error)) {
        await Promise.resolve(this.transferHooks?.onConnectionFailure?.());
      }
      return false;
    } finally {
      if (client) {
        client.trackProgress();
        this.disconnect(client);
      }
    }
  }

  async removeDirectory(localpath: string) {
    let client: Client | undefined;
    try {
      client = await this.connect();
      const remoteDir = this.__getRemotePath(localpath);
      await client.removeDir(remoteDir);
    } catch (error: unknown) {
      if (error instanceof FTPError && error.code !== 550) {
        this.logger?.(`error removing directory: ${error.message}`, "error", {
          type: "directory",
          event: "removed",
        });
      }
    } finally {
      this.disconnect(client);
    }
  }

  private __getRemotePath(localpath: string) {
    const subtrDir = localpath.replace(this.config.localDirectory, "");
    return path.join(this.config.remoteDirectory, subtrDir).replace(/\\/g, "/");
  }
}
