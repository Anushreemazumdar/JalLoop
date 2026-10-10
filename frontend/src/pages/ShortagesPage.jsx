import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconPlus,
  IconRefresh,
} from "../components/Icons.jsx";

export default function ShortagesPage() {
  const [shortages, setShortages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("");

  const [form, setForm] = useState({
    locationLabel: "",
    severity: "HIGH",
    description: "",
    latitude: 18.5074,
    longitude: 73.8077,
    observedAt: new Date().toISOString().slice(0, 16),
    estimatedAffectedDemandM3PerDay: "12.0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(false);

  useEffect(() => {
    loadShortages();
  }, [filterSeverity]);

  async function loadShortages() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.shortages(filterSeverity);
      setShortages(data || []);
    } catch (err) {
      setError(err.message || "Failed to load water shortage register");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setFormError("Please enter description of the supply deficit.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        locationLabel: form.locationLabel || null,
        severity: form.severity,
        description: form.description,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        observedAt: new Date(form.observedAt).toISOString(),
        estimatedAffectedDemandM3PerDay: form.estimatedAffectedDemandM3PerDay
          ? parseFloat(form.estimatedAffectedDemandM3PerDay)
          : null,
      };

      await api.createShortage(payload);
      setFormSuccess(true);
      setForm((p) => ({ ...p, locationLabel: "", description: "" }));
      loadShortages();
    } catch (err) {
      setFormError(err.message || "Failed to submit shortage report");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate totals
  const totalAffectedDemand = shortages.reduce(
    (acc, s) => acc + (parseFloat(s.estimatedAffectedDemandM3PerDay) || 0),
    0
  );

  return (
    <div>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Water shortages & demand deficits</h1>
          <p className="editorial-subtext">
            Systematic register of community supply failures, low-pressure zones, and municipal water deficits prioritized for emergency relief and non-potable recovery pairing.
          </p>
        </div>
      </div>

      {/* Operational Summary Ledger */}
      <div className="ledger-banner">
        <div className="ledger-cell">
          <span className="ledger-cell-title">Reported deficits</span>
          <div className="ledger-cell-value">{shortages.length}</div>
          <span className="ledger-cell-desc">Logged supply disruptions</span>
        </div>

        <div className="ledger-cell alert">
          <span className="ledger-cell-title">Critical severity</span>
          <div className="ledger-cell-value">
            {shortages.filter((s) => s.severity === "CRITICAL").length}
          </div>
          <span className="ledger-cell-desc">Zero supply &gt; 48 hours</span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-cell-title">Affected community demand</span>
          <div className="ledger-cell-value">
            {totalAffectedDemand.toFixed(1)}<span className="ledger-cell-unit">m³/day</span>
          </div>
          <span className="ledger-cell-desc">Total estimated volume deficit</span>
        </div>
      </div>

      <div className="civic-callout info">
        <div>
          <strong>Operational heuristic standard:</strong> Shortage priority scores rank wards based on reported severity and population demand. The system assists engineering triage and never fabricates water availability.
        </div>
      </div>

      {/* Asymmetric Split Layout */}
      <div className="split-layout-65-35">
        {/* Left Column: Prioritized Shortage Register */}
        <div>
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Prioritized deficit queue ({shortages.length})</h2>
                <span className="panel-sub">Ranked by heuristic urgency score</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="select-input"
                  style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.78rem" }}
                >
                  <option value="">All severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                </select>
                <button className="btn btn-secondary btn-sm" onClick={loadShortages} title="Refresh">
                  <IconRefresh size={12} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="state-box">
                <div className="spinner-crisp"></div>
                <div className="state-box-title">Loading shortage queue</div>
              </div>
            ) : error ? (
              <div className="civic-callout danger" style={{ margin: "1rem" }}>
                <strong>Error:</strong> {error}
              </div>
            ) : shortages.length === 0 ? (
              <div className="state-box">
                <div className="state-box-title">No water shortages recorded</div>
                <p style={{ fontSize: "0.82rem" }}>Log a community deficit using the intake form on the right.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="civic-table">
                  <thead>
                    <tr>
                      <th>Location / Cluster</th>
                      <th>Priority rank</th>
                      <th>Severity</th>
                      <th>Affected demand</th>
                      <th>Observed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortages.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>
                            {s.locationLabel || "Unlabelled settlement"}
                          </div>
                          <div style={{ fontSize: "0.76rem", color: "var(--ink-secondary)", marginTop: "0.15rem" }}>
                            {s.description?.slice(0, 85)}...
                          </div>
                          {s.syntheticDemo && (
                            <span className="tag-notice" style={{ marginTop: "0.25rem", display: "inline-block" }}>
                              SYNTHETIC DEMO
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className="priority-flag"
                            style={{
                              backgroundColor:
                                s.heuristicPriorityBand === "CRITICAL"
                                  ? "var(--urgent-tint)"
                                  : s.heuristicPriorityBand === "HIGH"
                                  ? "var(--warning-tint)"
                                  : "var(--water-tint)",
                              color:
                                s.heuristicPriorityBand === "CRITICAL"
                                  ? "var(--urgent-red)"
                                  : s.heuristicPriorityBand === "HIGH"
                                  ? "var(--warning-amber)"
                                  : "var(--water-primary)",
                              border: "1px solid currentColor",
                            }}
                          >
                            {s.heuristicPriorityBand || "NORMAL"} ({s.heuristicPriorityScore ?? 0})
                          </span>
                        </td>
                        <td>
                          <span className={`priority-flag ${s.severity?.toLowerCase() || "moderate"}`}>
                            {s.severity}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                          {s.estimatedAffectedDemandM3PerDay ? `${s.estimatedAffectedDemandM3PerDay} m³/day` : "&mdash;"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                          {new Date(s.observedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Intake Form */}
        <div>
          <form onSubmit={handleSubmit} className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Log community deficit</h2>
                <span className="panel-sub">Field intake for supply triage</span>
              </div>
            </div>

            <div className="panel-body">
              {formSuccess && (
                <div className="civic-callout success">
                  <IconCheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>Deficit report registered and ranked in operational queue.</span>
                </div>
              )}

              {formError && (
                <div className="civic-callout danger">
                  <strong>Error:</strong> {formError}
                </div>
              )}

              <div className="form-section">
                <div>
                  <label className="field-label">Settlement or tap cluster *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ward 14 public tap cluster, Katraj"
                    value={form.locationLabel}
                    onChange={(e) => setForm((p) => ({ ...p, locationLabel: e.target.value }))}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="field-label">Severity *</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
                      className="select-input"
                    >
                      <option value="CRITICAL">Critical (0 supply &gt; 48 hrs)</option>
                      <option value="HIGH">High (Severe low pressure)</option>
                      <option value="MODERATE">Moderate (Intermittent timing)</option>
                      <option value="LOW">Low (Temporary disruption)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Deficit demand (m³/day)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 15.0"
                      value={form.estimatedAffectedDemandM3PerDay}
                      onChange={(e) => setForm((p) => ({ ...p, estimatedAffectedDemandM3PerDay: e.target.value }))}
                      className="text-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="field-label" style={{ fontSize: "0.72rem" }}>Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={form.latitude}
                      onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                      className="text-input"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: "0.72rem" }}>Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={form.longitude}
                      onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                      className="text-input"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Observed timestamp *</label>
                  <input
                    type="datetime-local"
                    value={form.observedAt}
                    onChange={(e) => setForm((p) => ({ ...p, observedAt: e.target.value }))}
                    className="text-input"
                    required
                  />
                </div>

                <div>
                  <label className="field-label">Deficit description & community impact *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe number of affected households, tanker reliance, or water pressure failure..."
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className="textarea-input"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                  {submitting ? "Computing priority..." : "Commit shortage record"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
