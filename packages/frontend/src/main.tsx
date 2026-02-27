import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DisplayPreferencesProvider } from "./contexts/DisplayPreferencesContext";
import { App } from "./App";
import "./styles/index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DisplayPreferencesProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </DisplayPreferencesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
