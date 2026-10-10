import { useEffect, useState } from "react";
import { api } from "../services/api.js";

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
    estimatedAffectedDemandM3PerDay: "10.00",
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
      setError(err.message || "Failed to load water shortages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setFormError("Please enter description of the water deficit.");
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Water Shortage Reporting & Heuristic Prioritization</h2>
          <p>
            Systematically capture community water deficits and prioritize non-potable recovery opportunities to relieve stressed supply zones.
          </p>
        </div>
      </div>

      <div className="alert alert-info">
        <strong>Integrity Rule:</strong> Heuristic priority scores are advisory ranking calculations based on severity and reported community demand. They never fabricate water availability or replace official municipal tanker routing.
      </div>

      <div className="detail-grid">
        {/* Shortages List / Table */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Prioritized Community Shortage Queue ({shortages.length})</h3>
                <p>Sorted by heuristic urgency score</p>
              </div>

              <div className="filter-item">
                <label>Filter:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="form-control"
                  style={{ width: "auto", fontSize: "0.8rem", padding: "0.3rem 0.6rem" }}
                >
                  <option value="">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Loading shortage queue...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : shortages.length === 0 ? (
              <div className="empty-state">
                <p>No water shortage reports logged in this filter.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Location / Cluster</th>
                      <th>Priority Band</th>
                      <th>Severity</th>
                      <th>Affected Demand</th>
                      <th>Observed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortages.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{s.locationLabel || "Unlabelled Zone"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--gray-600)", marginTop: "0.2rem" }}>
                            {s.description?.slice(0, 70)}...
                          </div>
                          {s.syntheticDemo && (
                            <span className="badge badge-synthetic" style={{ marginTop: "0.25rem" }}>
                              SYNTHETIC DEMO
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor:
                                s.heuristicPriorityBand === "CRITICAL"
                                  ? "#fee2e2"
                                  : s.heuristicPriorityBand === "HIGH"
                                  ? "#ffedd5"
                                  : "#e0f2fe",
                              color:
                                s.heuristicPriorityBand === "CRITICAL"
                                  ? "#991b1b"
                                  : s.heuristicPriorityBand === "HIGH"
                                  ? "#9a3412"
                                  : "#0369a1",
                            }}
                          >
                            {s.heuristicPriorityBand || "NORMAL"} ({s.heuristicPriorityScore ?? 0})
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${s.severity?.toLowerCase() || "moderate"}`}>
                            {s.severity}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                          {s.estimatedAffectedDemandM3PerDay ? `${s.estimatedAffectedDemandM3PerDay} m³/day` : "Unspecified"}
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
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

        {/* Shortage Intake Form */}
        <div>
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Report Water Shortage</h3>
                <p>Log residential / ward supply deficit</p>
              </div>
            </div>

            {formSuccess && (
              <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Shortage report registered and prioritized.</span>
                <button className="btn btn-sm btn-secondary" onClick={() => setFormSuccess(false)}>
                  Close
                </button>
              </div>
            )}

            {formError && <div className="alert alert-danger">{formError}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Location Label / Settlement *</label>
                <input
                  type="text"
                  placeholder="e.g. Ward 14 public tap cluster, Katraj"
                  value={form.locationLabel}
                  onChange={(e) => setForm((p) => ({ ...p, locationLabel: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Severity *</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
                    className="form-control"
                  >
                    <option value="CRITICAL">Critical (0 supply &gt; 48 hrs)</option>
                    <option value="HIGH">High (Severe low pressure)</option>
                    <option value="MODERATE">Moderate (Intermittent timing)</option>
                    <option value="LOW">Low (Temporary disruption)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Affected Demand (m³/day)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 15.0"
                    value={form.estimatedAffectedDemandM3PerDay}
                    onChange={(e) => setForm((p) => ({ ...p, estimatedAffectedDemandM3PerDay: e.target.value }))}
                    className="form-control"
                  />
                  <span className="form-help">Approximate community deficit</span>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.latitude}
                    onChange={(e) => setForm((p) => ({ ...p, latitude: e.target.value }))}
                    className="form-control"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={form.longitude}
                    onChange={(e) => setForm((p) => ({ ...p, longitude: e.target.value }))}
                    className="form-control"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Observed Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.observedAt}
                  onChange={(e) => setForm((p) => ({ ...p, observedAt: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Deficit Description & Impact *</label>
                <textarea
                  rows={3}
                  placeholder="Describe number of affected households, tanker dependency, or water pressure failure..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={submitting}>
                {submitting ? "Calculating Heuristic & Saving..." : "Submit Shortage Report"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
