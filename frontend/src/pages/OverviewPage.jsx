import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function OverviewPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.summary();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard summary");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-box">
        <div className="spinner"></div>
        <p>Loading JalLoop civic resilience overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <div>
          <strong>Error loading dashboard:</strong> {error}
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-secondary btn-sm" onClick={loadSummary}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Civic Water Resilience Dashboard</h2>
          <p>
            Real-time tracking of waterlogging, infrastructure leaks, recurring civic hotspots, and safely verified rainwater recovery.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/report" className="btn btn-primary">
            + Report Incident
          </Link>
          <Link to="/shortages" className="btn btn-secondary">
            + Log Shortage
          </Link>
          <Link to="/recovery" className="btn btn-teal">
            Calculate Recovery
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-card-title">Total Incidents</div>
          <div className="stat-card-value">{summary?.totalIncidents ?? 0}</div>
          <div className="stat-card-subtext">Citizen & staff reported records</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-card-title">Unresolved Issues</div>
          <div className="stat-card-value">{summary?.unresolvedIncidents ?? 0}</div>
          <div className="stat-card-subtext">Awaiting inspection or repair</div>
        </div>

        <div className="stat-card rose">
          <div className="stat-card-title">Recurring Hotspots</div>
          <div className="stat-card-value">{summary?.recurringHotspots ?? 0}</div>
          <div className="stat-card-subtext">Spatial clusters with repeat failures</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-card-title">Water Shortages</div>
          <div className="stat-card-value">{summary?.waterShortageReports ?? 0}</div>
          <div className="stat-card-subtext">Prioritized community supply deficits</div>
        </div>

        <div className="stat-card teal">
          <div className="stat-card-title">Potential Rainwater</div>
          <div className="stat-card-value">
            {summary?.estimatedPotentiallyRecoverableM3 ? `${summary.estimatedPotentiallyRecoverableM3} m³` : "0 m³"}
          </div>
          <div className="stat-card-subtext">Modelled candidate runoff (unverified)</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-card-title">Verified Recovered</div>
          <div className="stat-card-value">
            {summary?.verifiedRecoveredM3 ? `${summary.verifiedRecoveredM3} m³` : "0 m³"}
          </div>
          <div className="stat-card-subtext">Meter/gauge verified on site</div>
        </div>
      </div>

      {/* Verification Integrity Alert */}
      <div className="alert alert-info" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Hydrological Transparency Rule:</strong> Theoretical runoff \(V = P \times A \times C / 1000\) is clearly distinguished from verified recovery.
          Notice that while <strong>{summary?.estimatedPotentiallyRecoverableM3 ?? 0} m³</strong> is modelled, only <strong>{summary?.verifiedRecoveredM3 ?? 0} m³</strong> is physically verified.
        </div>
        <Link to="/recovery/review" className="btn btn-secondary btn-sm" style={{ whiteSpace: "nowrap" }}>
          View Verification Ledger
        </Link>
      </div>

      {/* Priority Items and Recent Incidents */}
      <div className="grid-2">
        {/* Priority Action Queue */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Priority Action Items</h3>
              <p>Advisory heuristic recommendations requiring human civic action</p>
            </div>
          </div>
          {summary?.priorityItems?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Severity</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.priorityItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.title}</td>
                      <td>
                        <span className={`badge badge-${item.severity?.toLowerCase() || "moderate"}`}>
                          {item.severity}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>{item.reason}</td>
                      <td>
                        {item.kind === "INCIDENT" ? (
                          <Link to={`/incidents/${item.entityId}`} className="btn btn-secondary btn-sm">
                            Inspect
                          </Link>
                        ) : (
                          <Link to="/shortages" className="btn btn-secondary btn-sm">
                            Prioritize
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No high-priority alerts pending at this time.</p>
            </div>
          )}
        </div>

        {/* Recent Incidents Stream */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Recent Incident Feed</h3>
              <p>Latest waterlogging, leaks, and drainage alerts</p>
            </div>
            <Link to="/map" className="btn btn-secondary btn-sm">
              Open Map View &rarr;
            </Link>
          </div>
          {summary?.recentIncidents?.length > 0 ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th>Reported</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentIncidents.map((inc) => (
                    <tr key={inc.id}>
                      <td>
                        <span className={`badge badge-${inc.category?.toLowerCase()?.replace("_", "-")}`}>
                          {inc.category?.replace("_", " ")}
                        </span>
                        {inc.syntheticDemo && (
                          <span className="badge badge-synthetic" style={{ marginLeft: "0.3rem" }}>
                            DEMO
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                          {inc.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={inc.locationLabel}>
                        {inc.locationLabel || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                      </td>
                      <td style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                        {inc.firstObservedAt ? new Date(inc.firstObservedAt).toLocaleDateString() : "Recent"}
                      </td>
                      <td>
                        <Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm">
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>No incidents recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
