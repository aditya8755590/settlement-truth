import React from "react";

export default function Navbar({ onReset, isResetting }) {
  return (
    <nav className="topbar">
      <a className="brand" href="#top">
        <span className="brand-mark">S</span>
        <span>
          Settlement <b>Truth</b>
        </span>
      </a>
      <div className="nav-meta">
        <span className="status-dot"></span> Live Node.js Engine · Synthetic Demo
      </div>
      <button
        className="outline-button"
        id="resetButton"
        onClick={onReset}
        disabled={isResetting}
      >
        {isResetting ? "Resetting…" : "Reset demo"}
      </button>
    </nav>
  );
}
