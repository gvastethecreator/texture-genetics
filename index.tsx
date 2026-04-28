import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import "./src/index.css";
import { initStudioAuthBridge } from "./src/shared/utils/studioAuthBridge";

type ImportMetaWithHot = ImportMeta & {
  hot?: {
    dispose: (callback: () => void) => void;
  };
};

const disposeStudioAuthBridge = initStudioAuthBridge();
const hot = (import.meta as ImportMetaWithHot).hot;

if (hot) {
  hot.dispose(() => {
    disposeStudioAuthBridge();
  });
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
