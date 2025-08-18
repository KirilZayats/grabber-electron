import { useEffect, useState } from "react";

export const useProgress = () => {
  const [progress, setProgress] = useState<FilesLoadProgress[]>([]);

  useEffect(() => {
    const unsub = window.electron.subscribeProgress((progress) => {
      setProgress((prev) => {
        const index = prev.findIndex((p) => p.fileName === progress.fileName);
        if (index === -1) {
          return [...prev, progress];
        }
        return [...prev.slice(0, index), progress, ...prev.slice(index + 1)];
      });
    });
    return unsub;
  }, []);

  return progress;
};
