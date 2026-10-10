import { NavLink, Outlet } from "react-router-dom";
import { useActor } from "../hooks/useActor.jsx";
import {
  IconDroplet,
  IconMapPin,
  IconFileText,
  IconAlertTriangle,
  IconLayers,
  IconCheckCircle,
  IconUser,
} from "../components/Icons.jsx";

export default function AppLayout() {
  const { actor, actors, setActor } = useActor();

  return (
    <div className="app-shell">
      {/* Primary Top Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/" className="brand-unit">
            <span className="brand-wordmark">
              JalLoop<span className="brand-dot"></span>
            </span>
            <span className="brand-subline">Water Resilience Ledger</span>
          </NavLink>

          <nav>
            <ul className="primary-nav">
              <li>
                <NavLink to="/" end className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconDroplet size={14} />
                  <span>Overview</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/map" className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconMapPin size={14} />
                  <span>Incident map</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/reports" className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconFileText size={14} />
                  <span>Reports</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/shortages" className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconAlertTriangle size={14} />
                  <span>Water shortages</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/recovery" className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconLayers size={14} />
                  <span>Recovery planning</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/recovery/review" className={({ isActive }) => `nav-item-link ${isActive ? "active" : ""}`}>
                  <IconCheckCircle size={14} />
                  <span>Projects & verification</span>
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="header-actions-group">
            <div className="persona-selector">
              <IconUser size={13} style={{ color: "var(--ink-muted)" }} />
              <span className="persona-label">Role:</span>
              <select
                className="persona-select"
                value={actor.key}
                onChange={(e) => setActor(e.target.value)}
                title="Switch active municipal persona to evaluate role permissions"
              >
                {actors.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label} ({a.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Understated Static Integrity Notice (No Marquee, No Scrolling Text) */}
      <div className="system-notice-strip">
        <div className="system-notice-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="tag-notice">INTEGRITY NOTICE</span>
            <span>
              Synthetic demonstration records are explicitly tagged. Theoretical runoff calculations are never counted as verified civic water recovery without on-site measurement.
            </span>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
            Rational Equation: \(V = P \cdot A \cdot C / 1000\)
          </div>
        </div>
      </div>

      {/* Main Page Canvas */}
      <main className="page-canvas">
        <Outlet />
      </main>

      {/* Restrained Civic Footer */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <strong>JalLoop</strong> &mdash; Civic infrastructure resilience platform for waterlogging mitigation, drainage recurrence tracking, and verified rainwater recovery.
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
            Active Persona: {actor.label} ({actor.role}) &bull; Verification Standard: Rational Method + Physical Gauging
          </div>
        </div>
      </footer>
    </div>
  );
}
