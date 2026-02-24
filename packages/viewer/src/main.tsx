import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const el = document.getElementById("root")!;
const root = createRoot(el);
root.render(<App />);
