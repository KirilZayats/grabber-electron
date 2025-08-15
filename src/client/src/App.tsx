import { MainPage } from "@/pages";
import { Toaster } from "@/components";
import { toaster } from "@/providers";

function App() {
  return (
    <div>
      <MainPage />
      <Toaster toaster={toaster} />
    </div>
  );
}

export default App;
