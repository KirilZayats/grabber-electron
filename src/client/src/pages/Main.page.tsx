import { FtpForm, LogPanel, FilesLoadProgress } from "@/components";
import styles from "./pages.module.scss";
import { useProgress } from "@/hooks";

const MainPage = () => {
  const progress = useProgress();

  return (
    <div className={styles._}>
      <FtpForm />
      <div className={styles._right}>
        <LogPanel />
        <FilesLoadProgress progress={progress} />
      </div>
    </div>
  );
};

export { MainPage };
