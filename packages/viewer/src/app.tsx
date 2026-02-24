import React, { useEffect, useState } from "react";
import DagRenderer from "./dag-renderer";
import example from "../example-run.json";

export function App() {
  const [data, setData] = useState(example);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to read ?data= URL to load external JSON
    const params = new URLSearchParams(window.location.search);
    const url = params.get("data");
    if (url) {
      fetch(url)
        .then((r) => r.json())
        .then(setData)
        .catch((e) => setError(String(e)));
    }
  }, []);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>X-Skynet DAG Run Viewer</h1>
      {error && <p style={{ color: "red" }}>Failed to load external JSON: {error}</p>}
      <DagRenderer data={data} />
    </div>
  );
}

export default App;
