import fs from "fs";
import path from "path";
import type { FtpClient } from "./ftp.js";

const SYNC_OUTAGE_KEY = "sync-outage";

type RecoveryLogger = (
  message: string,
  type: LogType,
  scope: EventScope
) => void;

/** Subset of electron-json-storage used here (setSync exists at runtime). */
export type OutageStorage = {
  getSync(key: string): unknown;
  remove(key: string, callback: (err: unknown) => void): void;
  setSync(key: string, json: object): void;
};

function parseOutageState(raw: unknown): SyncOutageState | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (
    typeof o.outageStartedAt !== "string" ||
    typeof o.localDirectory !== "string"
  ) {
    return null;
  }
  return {
    outageStartedAt: o.outageStartedAt,
    localDirectory: o.localDirectory,
  };
}

function collectCandidateFiles(root: string, sinceMs: number): string[] {
  const result: string[] = [];

  function walk(dir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isSymbolicLink()) {
        continue;
      }
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile()) {
        let st: fs.Stats;
        try {
          st = fs.statSync(full);
        } catch {
          continue;
        }
        if (st.mtimeMs >= sinceMs || st.birthtimeMs >= sinceMs) {
          result.push(full);
        }
      }
    }
  }

  walk(root);
  return result;
}

function removeStorageKey(storage: OutageStorage, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    storage.remove(key, (err: unknown) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export class SyncRecovery {
  private catchUpInProgress = false;
  private readonly storage: OutageStorage;
  private readonly localDirectory: string;
  private readonly logger?: RecoveryLogger;

  constructor(
    storage: OutageStorage,
    localDirectory: string,
    logger?: RecoveryLogger
  ) {
    this.storage = storage;
    this.localDirectory = localDirectory;
    this.logger = logger;
  }

  private readState(): SyncOutageState | null {
    const raw = this.storage.getSync(SYNC_OUTAGE_KEY);
    return parseOutageState(raw);
  }

  markOutageIfNeeded(): void {
    const resolved = path.resolve(this.localDirectory);
    const existing = this.readState();
    if (
      existing &&
      path.resolve(existing.localDirectory) === resolved
    ) {
      return;
    }
    this.storage.setSync(SYNC_OUTAGE_KEY, {
      outageStartedAt: new Date().toISOString(),
      localDirectory: resolved,
    });
  }

  async onSuccessfulTransfer(ftpClient: FtpClient): Promise<void> {
    const state = this.readState();
    if (!state) {
      return;
    }
    if (
      path.resolve(state.localDirectory) !== path.resolve(this.localDirectory)
    ) {
      return;
    }
    if (this.catchUpInProgress) {
      return;
    }

    this.catchUpInProgress = true;
    try {
      const sinceMs = Date.parse(state.outageStartedAt);
      if (Number.isNaN(sinceMs)) {
        await removeStorageKey(this.storage, SYNC_OUTAGE_KEY);
        return;
      }

      const files = collectCandidateFiles(
        path.resolve(this.localDirectory),
        sinceMs
      );
      files.sort();

      for (const filePath of files) {
        const ok = await ftpClient.sendFile(filePath);
        if (!ok) {
          this.logger?.(
            "sync recovery: catch-up paused after a failed upload",
            "info",
            {
              type: "connection",
              event: "error",
            }
          );
          return;
        }
      }

      await removeStorageKey(this.storage, SYNC_OUTAGE_KEY);
      this.logger?.("sync recovery: catch-up finished", "info", {
        type: "connection",
        event: "success",
      });
    } catch (e) {
      this.logger?.(
        `sync recovery: catch-up error: ${
          e instanceof Error ? e.message : "unknown"
        }`,
        "error",
        {
          type: "connection",
          event: "error",
        }
      );
    } finally {
      this.catchUpInProgress = false;
    }
  }
}
