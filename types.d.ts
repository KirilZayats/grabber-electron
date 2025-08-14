interface FtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  localDirectory: string;
  remoteDirectory: string;
}

type LogType = "info" | "error" | "warning";
