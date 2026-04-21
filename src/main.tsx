import { RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RouterProvider router={getRouter()} />
  </React.StrictMode>,
);
