import { LogPanel, FilesLoadProgress } from "@/components";
import styles from "./pages.module.scss";
import { useProgress, useWindowInnerSize } from "@/hooks";
import { MainAppTabs } from "@/components/tabs/main-app-tabs";

const MainPage = () => {
  const progress = useProgress();
  const [windowSize] = useWindowInnerSize();

  return (
    <div className={styles._}>
      <MainAppTabs key={windowSize} />
      <div className={styles._right}>
        <LogPanel />
        <FilesLoadProgress progress={progress} />
      </div>
    </div>
  );
};

export { MainPage };
