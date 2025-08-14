import { FtpForm, LogPanel } from "@/components";
import styles from "./pages.module.scss";

const MainPage = () => {
  return (
    <div className={styles._}>
      <FtpForm />
      <div className={styles._logPanel}>
        <LogPanel />
      </div>
    </div>
  );
};

export { MainPage };
