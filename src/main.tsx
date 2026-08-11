import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import App from "./App";

import { ThemePresetProvider } from "./theme/ThemePresetProvider";

import { ProductsProvider } from "./data/ProductsProvider";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemePresetProvider>
          <ProductsProvider>
            <App />
          </ProductsProvider>
        </ThemePresetProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
