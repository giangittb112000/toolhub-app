import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";

export function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        {/* We will add more routes here in Phase 2/3 */}
      </Routes>
    </MemoryRouter>
  );
}
