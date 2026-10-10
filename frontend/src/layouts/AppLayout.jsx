import { NavLink, Outlet } from "react-router-dom";
import { useActor } from "../hooks/useActor.jsx";

export default function AppLayout() {
  const { actor, actors, setActor, isAdmin, isStaff } = useActor();

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <header className="navbar">
        <div className="navbar-inner">
          <NavLink to="/" className="brand">
            <div className="brand-logo">JL</div>
            <div className="brand-text">
              <h1>JalLoop</h1>
              <span>Bharat Builds &bull; Civic Water Resilience</span>
            </div>
          </NavLink>

          <nav>
            <ul className="nav-links">
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Overview
                </NavLink>
              </li>
              <li>
                <NavLink to="/map" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Incidents Map
                </NavLink>
              </li>
              <li>
                <NavLink to="/report" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Report Incident
                </NavLink>
              </li>
              <li>
                <NavLink to="/shortages" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Water Shortages
                </NavLink>
              </li>
              <li>
                <NavLink to="/recovery" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Recovery Calculator
                </NavLink>
              </li>
              <li>
                <NavLink to="/recovery/review" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  Project Review
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="actor-switcher">
            <span className="actor-label">Active Role:</span>
            <select
              className="actor-select"
              value={actor.key}
              onChange={(e) => setActor(e.target.value)}
              title="Switch demo persona to test Citizen, Inspector, and Admin capabilities"
            >
              {actors.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label} ({a.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Synthetic Demonstration Data Banner */}
      <aside className="demo-banner">
        <div className="demo-banner-content">
          <span className="demo-tag">SYNTHETIC DEMO MODE</span>
          <span>
            Demonstration incidents, rainfall values, and recovery records are synthetic and explicitly labelled. No actual civic field observations or lab quality tests are fabricated.
          </span>
        </div>
      </aside>

      {/* Main Outlet */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>
          <strong>JalLoop</strong> — Built for WeMakeDevs Bharat Builds Hackathon &bull; React + Vite + Leaflet &bull; Spring Boot 3.x &bull; MySQL &bull; FastAPI + AWS Strands Agents SDK
        </p>
        <p style={{ marginTop: "0.25rem", color: "var(--gray-400)" }}>
          Data integrity rule: Theoretical runoff \(V = P \times A \times C / 1000\) is never treated as verified water recovery. Road runoff is never automatically approved for reuse.
        </p>
      </footer>
    </div>
  );
}
