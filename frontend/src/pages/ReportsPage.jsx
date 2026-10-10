import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import {
  IconPlus,
  IconFilter,
  IconArrowRight,
  IconRefresh,
} from "../components/Icons.jsx";

export default function ReportsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");

  useEffect(() => {
    loadReports();
  }, [category, status, severity]);

  async function loadReports() {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      if (severity) params.severity = severity;

      const data = await api.incidents(params);
      setIncidents(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load incident reports");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Civic incident reports</h1>
          <p className="editorial-subtext">
            Comprehensive register of waterlogging occurrences, leaking supply pipes, and blocked stormwater channels across municipal wards.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/report" className="btn btn-primary">
            <IconPlus size={14} /> File new report
          </Link>
          <Link to="/map" className="btn btn-secondary">
            View on map
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="map-filter-tray">
        <div className="map-filter-group">
          <IconFilter size={13} style={{ color: "var(--ink-muted)" }} />
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All Categories</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="PIPE_LEAK">Pipe leak</option>
            <option value="BLOCKED_DRAIN">Blocked drain</option>
            <option value="WATER_SHORTAGE">Water shortage</option>
          </select>
        </div>

        <div className="map-filter-group">
          <label>Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="map-filter-group">
          <label>Priority:</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "0.78rem", color: "var(--ink-muted)", fontFamily: "var(--font-mono)" }}>
          {incidents.length} record{incidents.length === 1 ? "" : "s"} listed
        </div>
      </div>

      {/* Main Professional Data Table */}
      <div className="panel">
        {loading ? (
          <div className="state-box">
            <div className="spinner-crisp"></div>
            <div className="state-box-title">Loading incident register</div>
          </div>
        ) : error ? (
          <div className="civic-callout danger" style={{ margin: "1rem" }}>
            <div>
              <strong>Error loading records:</strong> {error}
              <button className="btn btn-secondary btn-sm" onClick={loadReports} style={{ marginLeft: "0.75rem" }}>
                <IconRefresh size={12} /> Retry
              </button>
            </div>
          </div>
        ) : incidents.length === 0 ? (
          <div className="state-box">
            <div className="state-box-title">No matching incident records</div>
            <p style={{ fontSize: "0.82rem" }}>Try clearing active filters or file a new civic report.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description & Landmark</th>
                  <th>Setting</th>
                  <th>Priority</th>
                  <th>Reported</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr key={inc.id}>
                    <td>
                      <span className="category-tag">
                        {inc.category?.replace("_", " ")}
                      </span>
                      {inc.syntheticDemo && (
                        <span className="tag-notice" style={{ display: "block", marginTop: "0.2rem", width: "fit-content" }}>
                          DEMO
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: "340px" }}>
                      <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>
                        {inc.locationLabel || "Unlabelled location"}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--ink-secondary)", marginTop: "0.15rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={inc.summary}>
                        {inc.summary}
                      </div>
                      {inc.suspectedDuplicate && (
                        <span style={{ fontSize: "0.7rem", color: "var(--warning-amber)", display: "inline-block", marginTop: "0.2rem" }}>
                          Spatial recurrence candidate
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                      {inc.locationType?.replace("_", " ")}
                    </td>
                    <td>
                      <span className={`priority-flag ${inc.severity?.toLowerCase() || "moderate"}`}>
                        {inc.severity || "MODERATE"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                      {inc.firstObservedAt ? new Date(inc.firstObservedAt).toLocaleDateString() : "&mdash;"}
                    </td>
                    <td>
                      <span className={`status-pill ${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
                        View dossier <IconArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
