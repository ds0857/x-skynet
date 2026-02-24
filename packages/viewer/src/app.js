import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import DagRenderer from "./dag-renderer";
import example from "../example-run.json";
export function App() {
  const [data, setData] = useState(example);
  const [error, setError] = useState(null);
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
  return _jsxs("div", {
    style: { padding: 16, fontFamily: "system-ui, sans-serif" },
    children: [
      _jsx("h1", { children: "X-Skynet DAG Run Viewer" }),
      error &&
        _jsxs("p", {
          style: { color: "red" },
          children: ["Failed to load external JSON: ", error],
        }),
      _jsx(DagRenderer, { data: data }),
    ],
  });
}
export default App;
//# sourceMappingURL=app.js.map
