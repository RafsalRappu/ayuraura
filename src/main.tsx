import React from "react";
import ReactDOM from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { HelmetProvider } from "react-helmet-async";

import App from "./App";

import { ThemePresetProvider } from "./theme/ThemePresetProvider";

import { ProductsProvider } from "./data/ProductsProvider";
import { CartProvider } from "./data/CartProvider";
import { CustomerAuthProvider } from "./data/CustomerAuthProvider";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemePresetProvider>
          <ProductsProvider>
            <CustomerAuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </CustomerAuthProvider>
          </ProductsProvider>
        </ThemePresetProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
