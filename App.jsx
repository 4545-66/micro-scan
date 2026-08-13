import React from "react";
import MicroScanScreen from "./components/MicroScanScreen.jsx";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0A0D0C",
      }}
    >
      <MicroScanScreen />
    </div>
  );
}
