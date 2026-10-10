import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconArrowRight,
  IconPlus,
  IconMapPin,
  IconRefresh,
} from "../components/Icons.jsx";

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
      setError(err.message || "Failed to load operational overview");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner-crisp"></div>
        <div className="state-box-title">Loading water resilience data</div>
        <p style={{ fontSize: "0.82rem" }}>Compiling municipal reports, recurrence signals, and recovery ledgers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="civic-callout danger">
        <IconAlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
        <div>
          <strong>Unable to load operational status:</strong> {error}
          <div style={{ marginTop: "0.5rem" }}>
            <button className="btn btn-secondary btn-sm" onClick={loadSummary}>
              <IconRefresh size={12} /> Retry request
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estimatedVol = summary?.estimatedPotentiallyRecoverableM3 ?? 0;
  const verifiedVol = summary?.verifiedRecoveredM3 ?? 0;

  return (
    <div>
      {/* Editorial Page Header */}
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Water resilience overview</h1>
          <p className="editorial-subtext">
            Operational status of waterlogging incidents, recurring drainage failures, and verified rainwater recovery across municipal wards.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/report" className="btn btn-primary">
            <IconPlus size={14} /> Report incident
          </Link>
          <Link to="/map" className="btn btn-secondary">
            <IconMapPin size={14} /> View incident map
          </Link>
        </div>
      </div>

      {/* Primary Operational Ledger Banner */}
      <div className="ledger-banner">
        <div className="ledger-cell">
          <span className="ledger-cell-title">Total incidents</span>
          <div className="ledger-cell-value">{summary?.totalIncidents ?? 0}</div>
          <span className="ledger-cell-desc">Logged civic records</span>
        </div>

        <div className={`ledger-cell ${summary?.unresolvedIncidents > 0 ? "alert" : ""}`}>
          <span className="ledger-cell-title">Unresolved issues</span>
          <div className="ledger-cell-value">{summary?.unresolvedIncidents ?? 0}</div>
          <span className="ledger-cell-desc">Awaiting inspection or repair</span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-cell-title">Recurring hotspots</span>
          <div className="ledger-cell-value">{summary?.recurringHotspots ?? 0}</div>
          <span className="ledger-cell-desc">Clustered failure locations</span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-cell-title">Assessments pending</span>
          <div className="ledger-cell-value">{summary?.recoveryAssessmentsAwaitingReview ?? 0}</div>
          <span className="ledger-cell-desc">Awaiting human review</span>
        </div>

        <div className="ledger-cell estimated">
          <span className="ledger-cell-title">Estimated recoverable</span>
          <div className="ledger-cell-value">
            {estimatedVol}<span className="ledger-cell-unit">m³</span>
          </div>
          <span className="ledger-cell-desc">Hydrological model estimate</span>
        </div>

        <div className="ledger-cell verified">
          <span className="ledger-cell-title">Verified recovered</span>
          <div className="ledger-cell-value">
            {verifiedVol}<span className="ledger-cell-unit">m³</span>
          </div>
          <span className="ledger-cell-desc">Metered on site</span>
        </div>
      </div>

      {/* Asymmetric Working Layout */}
      <div className="split-layout-65-35">
        {/* Left Column: Priority Unresolved Items & Recent Incidents Table */}
        <div>
          {/* Priority Attention Panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">High-priority unresolved issues</h2>
                <span className="panel-sub">Advisory signals requiring field inspection or maintenance sanction</span>
              </div>
              <span className="tag-notice">{summary?.priorityItems?.length || 0} queued</span>
            </div>

            {summary?.priorityItems?.length > 0 ? (
              <div className="table-wrap">
                <table className="civic-table">
                  <thead>
                    <tr>
                      <th>Title & Location</th>
                      <th>Priority</th>
                      <th>Operational reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.priorityItems.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{item.title}</span>
                        </td>
                        <td>
                          <span className={`priority-flag ${item.severity?.toLowerCase() || "moderate"}`}>
                            {item.severity}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                          {item.reason}
                        </td>
                        <td>
                          {item.kind === "INCIDENT" ? (
                            <Link to={`/incidents/${item.entityId}`} className="btn btn-secondary btn-sm">
                              Inspect <IconArrowRight size={11} />
                            </Link>
                          ) : (
                            <Link to="/shortages" className="btn btn-secondary btn-sm">
                              Prioritize <IconArrowRight size={11} />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-body" style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                No urgent unresolved issues currently pending review.
              </div>
            )}
          </div>

          {/* Recent Incident Records Table */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Recent incident activity</h2>
                <span className="panel-sub">Latest civic reports and maintenance statuses</span>
              </div>
              <Link to="/reports" className="btn btn-secondary btn-sm">
                View all reports &rarr;
              </Link>
            </div>

            {summary?.recentIncidents?.length > 0 ? (
              <div className="table-wrap">
                <table className="civic-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Reported</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentIncidents.map((inc) => (
                      <tr key={inc.id}>
                        <td>
                          <span className="category-tag">
                            {inc.category?.replace("_", " ")}
                          </span>
                          {inc.syntheticDemo && (
                            <span className="tag-notice" style={{ marginLeft: "0.35rem" }}>
                              DEMO
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: "200px" }}>
                          <span style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }} title={inc.locationLabel}>
                            {inc.locationLabel || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                            {inc.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                          {inc.firstObservedAt ? new Date(inc.firstObservedAt).toLocaleDateString() : "&mdash;"}
                        </td>
                        <td>
                          <Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="panel-body" style={{ color: "var(--ink-muted)", fontSize: "0.85rem" }}>
                No incidents recorded in the system yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Verification Reality Gap & Civic Directive */}
        <div>
          {/* Recovery Reality Gap Panel */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Verification ledger balance</h2>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", marginBottom: "1rem" }}>
                Civic resilience governance mandates distinguishing theoretical candidate runoff from actual verified non-potable recovery.
              </p>

              <div style={{ border: "1px solid var(--border-light)", background: "var(--bg-subtle)", padding: "0.9rem", borderRadius: "var(--radius-xs)", marginBottom: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-muted)", fontWeight: 600 }}>
                    Estimated candidate volume
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--water-primary)" }}>
                    {estimatedVol} m³
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-muted)", fontWeight: 600 }}>
                    Physically metered recovery
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--verified-ink)" }}>
                    {verifiedVol} m³
                  </span>
                </div>
              </div>

              <div className="civic-callout info" style={{ marginBottom: "1rem" }}>
                <div>
                  <strong>Human verification rule:</strong> Water volume is credited only when an inspector records calibrated meter measurements or tank dip readings.
                </div>
              </div>

              <Link to="/recovery/review" className="btn btn-secondary" style={{ width: "100%" }}>
                Open project review ledger <IconArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Quick Civic Navigation Panel */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Operational shortcuts</h2>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <Link to="/report" className="btn btn-secondary" style={{ justifyContent: "space-between" }}>
                <span>File new water or drainage report</span>
                <IconArrowRight size={12} />
              </Link>
              <Link to="/map" className="btn btn-secondary" style={{ justifyContent: "space-between" }}>
                <span>Inspect spatial incident map</span>
                <IconArrowRight size={12} />
              </Link>
              <Link to="/shortages" className="btn btn-secondary" style={{ justifyContent: "space-between" }}>
                <span>Log community water shortage</span>
                <IconArrowRight size={12} />
              </Link>
              <Link to="/recovery" className="btn btn-secondary" style={{ justifyContent: "space-between" }}>
                <span>Run rational recovery calculation</span>
                <IconArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
