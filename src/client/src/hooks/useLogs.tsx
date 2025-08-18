import { useEffect, useState } from "react";

export const useLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    window.electron.getLogs();
    const unsub = window.electron.subscribeLogs((log) => {
      setLogs((prev) =>
        [...prev, log].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
      );
    });
    return unsub;
  }, []);

  return logs;
};
