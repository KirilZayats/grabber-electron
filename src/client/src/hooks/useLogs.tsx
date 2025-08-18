import { useEffect, useState } from "react";

export const useLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    window.electron.getLogs();
    const unsub = window.electron.subscribeLogs((log) => {
      setLogs((prev) => {
        if (!prev.find(({ id }) => id === log.id)) {
          return [...prev, log].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        }
        return prev;
      });
    });

    return unsub;
  }, []);

  return logs;
};
