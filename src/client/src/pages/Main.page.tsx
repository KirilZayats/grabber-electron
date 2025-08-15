import { FtpForm, LogPanel } from "@/components";
import styles from "./pages.module.scss";

const MainPage = () => {
  return (
    <div className={styles._}>
      <FtpForm />
      <LogPanel />
    </div>
  );
};

export { MainPage };
