import { MainPage } from "@/pages";
import { Toaster } from "@/components";
import { toaster } from "@/providers";
import { locales, messages } from "./i18n";
import { IntlProvider } from "react-intl";
import { useGlobalStore } from "./hooks";

function App() {
  const { locale } = useGlobalStore();
  return (
    <IntlProvider
      defaultLocale={locales.En}
      locale={locale}
      messages={messages[locale]}
    >
      <MainPage />
      <Toaster toaster={toaster} />
    </IntlProvider>
  );
}

export default App;
