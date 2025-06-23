import React from "react";
import { createRoot } from "react-dom/client";
import Chat from "../webview-ui/components/Chat";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Chat />);
