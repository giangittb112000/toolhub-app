import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import SystemMonitor from "./pages/modules/system-monitor";

// Temporary basic components for Phase 2 navigation testing
const MockApi = () => <div className="p-8 text-zinc-400">Mock API Module (Phase 4)</div>;
const JsonFormatter = () => (
  <div className="p-8 text-zinc-400">JSON Formatter Module (Phase 4)</div>
);

export function App() {
  return (
    <MemoryRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/modules/system-monitor" element={<SystemMonitor />} />
          <Route path="/modules/mock-api" element={<MockApi />} />
          <Route path="/modules/json-formatter" element={<JsonFormatter />} />
        </Routes>
      </Layout>
    </MemoryRouter>
  );
}
