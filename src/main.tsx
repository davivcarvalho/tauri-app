import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { isPermissionGranted, requestPermission } from '@tauri-apps/api/notification';

let permissionGranted = await isPermissionGranted();
if (!permissionGranted) {
  const permission = await requestPermission();
  permissionGranted = permission === 'granted';
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
