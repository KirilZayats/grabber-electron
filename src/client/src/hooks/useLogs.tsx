import { useEffect, useState } from "react";

export const useLogs = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    const unsub = window.electron.subscribeLogs((log) => {
      setLogs((prev) => [...prev, log]);
    });
    return unsub;
  }, []);

  return logs;
};
