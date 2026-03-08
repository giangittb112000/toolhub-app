import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAppFont } from "./hooks/useAppFont";
import { Dashboard } from "./pages/Dashboard";
import JsonFormatter from "./pages/modules/json-formatter";
import MockApi from "./pages/modules/mock-api";
import SystemMonitor from "./pages/modules/system-monitor";

export function App() {
  // Initialize global font on mount
  useAppFont();

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
