interface FtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  localDirectory: string;
  remoteDirectory: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ParametersExceptFirst<F> = F extends (first: any, ...rest: infer R) => any
  ? R
  : never;

interface DirectoryNode {
  id: string;
  name: string;
  children: DirectoryNode[];
}

interface FilesLoadProgress {
  fileName: string;
  progress: number;
}

interface Log {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
  scope: EventScope;
}

type LogType = "info" | "error" | "warning";

type FileEvent = "created" | "changed" | "removed" | "sent" | "deleted";
type WatchEvent = "stopped" | "started";
type ConnectionEvent = "success" | "error";

type EventScope =
  | {
      type: "file";
      event: FileEvent;
    }
  | {
      type: "directory";
      event: FileEvent;
    }
  | {
      type: "connection";
      event: ConnectionEvent;
    }
  | {
      type: "watch";
      event: WatchEvent;
    };

type EventPayloadMapping = {
  log: Log;
  testFtpConnection: FtpConfig;
  testFtpConnectionResult: boolean;
  selectLocalDirectory: undefined;
  selectLocalDirectoryResult: string;
  validateLocalDirectory: string;
  validateLocalDirectoryResult: { path: string; exists: boolean };
  startWatching: FtpConfig;
  stopWatching: undefined;
  getFtpTree: FtpConfig;
  getFtpTreeResult: DirectoryNode[];
  subscribeProgress: FilesLoadProgress;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    subscribeLogs: (callback: (log: Log) => void) => UnsubscribeFunction;
    testFtpConnection: (payload: FtpConfig) => void;
    testFtpConnectionResult: (
      callback: (result: boolean) => void
    ) => UnsubscribeFunction;
    selectLocalDirectory: () => void;
    selectLocalDirectoryResult: (
      callback: (result: string) => void
    ) => UnsubscribeFunction;
    validateLocalDirectory: (payload: string) => void;
    validateLocalDirectoryResult: (
      callback: (result: { path: string; exists: boolean }) => void
    ) => UnsubscribeFunction;
    startWatching: (payload: FtpConfig) => void;
    stopWatching: () => void;
    getFtpTree: (payload: FtpConfig & { path?: string }) => void;
    getFtpTreeResult: (
      callback: (result: DirectoryNode[]) => void
    ) => UnsubscribeFunction;
    subscribeProgress: (
      callback: (progress: FilesLoadProgress) => void
    ) => UnsubscribeFunction;
  };
}
