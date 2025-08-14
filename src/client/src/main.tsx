import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@/providers";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider>
      <App />
    </ChakraProvider>
  </StrictMode>
);
