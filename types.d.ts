interface FtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  localDirectory: string;
  remoteDirectory: string;
}
interface Log {
  id: string;
  timestamp: string;
  type: LogType;
  message: string;
}

type LogType = "info" | "error" | "warning";

type EventPayloadMapping = {
  log: Log;
  testFtpConnection: FtpConfig;
  testFtpConnectionResult: boolean;
};

type UnsubscribeFunction = () => void;

interface Window {
  electron: {
    subscribeLogs: (callback: (log: Log) => void) => UnsubscribeFunction;
    testFtpConnection: (payload: FtpConfig) => void;
    testFtpConnectionResult: (
      callback: (result: boolean) => void
    ) => UnsubscribeFunction;
  };
}
