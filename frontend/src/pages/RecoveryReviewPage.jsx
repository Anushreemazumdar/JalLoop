import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useActor } from "../hooks/useActor.jsx";
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconPlus,
  IconArrowRight,
  IconRefresh,
} from "../components/Icons.jsx";

export default function RecoveryReviewPage() {
  const { actor, isAdmin, isStaff } = useActor();

  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal states
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalMode, setModalMode] = useState(null); // "review" | "measure"

  // Review form
  const [reviewForm, setReviewForm] = useState({
    reviewStatus: "APPROVED",
    implementationStatus: "UNDER_CONSTRUCTION",
    reviewReason: "",
    constraints: "",
  });

  // Measure form
  const [measureForm, setMeasureForm] = useState({
    measuredVolumeM3: "5.0",
    method: "Calibrated flow meter reading at storage tank outlet",
    measuredAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadLedgerData();
  }, []);

  async function loadLedgerData() {
    try {
      setLoading(true);
      setError(null);
      const [overviewData, projectList] = await Promise.all([
        api.recoveryOverview(),
        api.projects(),
      ]);
      setOverview(overviewData);
      setProjects(projectList || []);
    } catch (err) {
      setError(err.message || "Failed to load project ledger");
    } finally {
      setLoading(false);
    }
  }

  function openReviewModal(proj) {
    setSelectedProject(proj);
    setReviewForm({
      reviewStatus: proj.reviewStatus || "APPROVED",
      implementationStatus: proj.implementationStatus || "UNDER_CONSTRUCTION",
      reviewReason: proj.reviewReason || "",
      constraints: proj.constraints || "",
    });
    setModalMode("review");
  }

  function openMeasureModal(proj) {
    setSelectedProject(proj);
    setModalMode("measure");
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    try {
      await api.reviewProject(selectedProject.id, reviewForm);
      setNotification(`Project review decision committed for "${selectedProject.title}".`);
      setModalMode(null);
      loadLedgerData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMeasureSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        measuredVolumeM3: parseFloat(measureForm.measuredVolumeM3),
        method: measureForm.method,
        measuredAt: new Date(measureForm.measuredAt).toISOString(),
      };
      await api.measureProject(selectedProject.id, payload);
      setNotification(`Physical measurement recorded for "${selectedProject.title}".`);
      setModalMode(null);
      loadLedgerData();
    } catch (err) {
      setError(err.message);
    }
  }

  const estimatedVol = overview?.estimatedPotentiallyRecoverableM3 ?? 0;
  const verifiedVol = overview?.verifiedRecoveredM3 ?? 0;

  return (
    <div>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Projects & verification ledger</h1>
          <p className="editorial-subtext">
            Municipal governance and physical verification ledger for sanctioned rainwater recovery projects.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/recovery" className="btn btn-secondary">
            &larr; Recovery planning calculator
          </Link>
          <button className="btn btn-secondary" onClick={loadLedgerData} title="Refresh">
            <IconRefresh size={13} />
          </button>
        </div>
      </div>

      {notification && (
        <div className="civic-callout success">
          <IconCheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="civic-callout danger">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* 4-Stage Volume Lifecycle Balance Sheet */}
      <div className="ledger-banner">
        <div className="ledger-cell estimated">
          <span className="ledger-cell-title">1. Estimated runoff</span>
          <div className="ledger-cell-value">
            {estimatedVol}<span className="ledger-cell-unit">m³</span>
          </div>
          <span className="ledger-cell-desc">Hydrological model ceiling</span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-cell-title">2. Approved projects</span>
          <div className="ledger-cell-value">
            {projects.filter((p) => p.reviewStatus === "APPROVED").length}
          </div>
          <span className="ledger-cell-desc">Sanctioned by human review</span>
        </div>

        <div className="ledger-cell">
          <span className="ledger-cell-title">3. Active installations</span>
          <div className="ledger-cell-value">
            {projects.filter((p) => p.implementationStatus === "COMPLETED" || p.implementationStatus === "UNDER_CONSTRUCTION").length}
          </div>
          <span className="ledger-cell-desc">Constructed or operational</span>
        </div>

        <div className="ledger-cell verified">
          <span className="ledger-cell-title">4. Verified water recovered</span>
          <div className="ledger-cell-value">
            {verifiedVol}<span className="ledger-cell-unit">m³</span>
          </div>
          <span className="ledger-cell-desc">Metered on site (non-potable)</span>
        </div>
      </div>

      <div className="civic-callout info">
        <div>
          <strong>The JalLoop Verification Commitment:</strong> We never treat estimated or modelled runoff as recovered water. Water is only certified in Stage 4 when field engineers log physical flow-meter readings or calibrated tank dip measurements.
        </div>
      </div>

      {/* Projects Ledger Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2 className="panel-title">Sanctioned projects ledger ({projects.length})</h2>
            <span className="panel-sub">Civil works review decisions and physical measurements</span>
          </div>
        </div>

        {loading ? (
          <div className="state-box">
            <div className="spinner-crisp"></div>
            <div className="state-box-title">Loading project ledger</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="state-box">
            <div className="state-box-title">No recovery projects registered</div>
            <p style={{ fontSize: "0.82rem" }}>
              Run a rational assessment in the <Link to="/recovery">Recovery Planning</Link> tab, then promote it to candidate project.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="civic-table">
              <thead>
                <tr>
                  <th>Project title & ID</th>
                  <th>Governance review</th>
                  <th>Implementation</th>
                  <th>Constraints & safety directives</th>
                  <th>Physical measurements</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--ink-primary)" }}>{p.title}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.74rem", color: "var(--ink-muted)", marginTop: "0.15rem" }}>
                        Assessment: {p.assessmentId?.slice(0, 8)}...
                      </div>
                      {p.syntheticDemo && (
                        <span className="tag-notice" style={{ marginTop: "0.25rem", display: "inline-block" }}>
                          SYNTHETIC DEMO
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className="status-pill"
                        style={{
                          backgroundColor:
                            p.reviewStatus === "APPROVED"
                              ? "var(--verified-tint)"
                              : p.reviewStatus === "REJECTED"
                              ? "var(--urgent-tint)"
                              : "var(--warning-tint)",
                          color:
                            p.reviewStatus === "APPROVED"
                              ? "var(--verified-ink)"
                              : p.reviewStatus === "REJECTED"
                              ? "var(--urgent-red)"
                              : "var(--warning-amber)",
                          border: "1px solid currentColor",
                        }}
                      >
                        {p.reviewStatus}
                      </span>
                    </td>
                    <td>
                      <span className="status-pill in-progress">
                        {p.implementationStatus}
                      </span>
                    </td>
                    <td style={{ maxWidth: "240px", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                      {p.constraints || p.reviewReason || "None recorded"}
                    </td>
                    <td>
                      {p.measurements?.length > 0 ? (
                        <div>
                          {p.measurements.map((m) => (
                            <div key={m.id} style={{ fontSize: "0.8rem" }}>
                              <strong style={{ color: "var(--verified-ink)", fontFamily: "var(--font-mono)" }}>
                                {m.measuredVolumeM3} m³
                              </strong>
                              <span style={{ color: "var(--ink-muted)", fontSize: "0.72rem", marginLeft: "0.3rem" }}>
                                ({m.method})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.76rem", color: "var(--ink-muted)" }}>None logged</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        {isStaff && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReviewModal(p)}
                          >
                            Review
                          </button>
                        )}
                        <button
                          className="btn btn-verified btn-sm"
                          onClick={() => openMeasureModal(p)}
                        >
                          + Log meter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Governance Review */}
      {modalMode === "review" && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="panel-title">Human governance review</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalMode(null)}>&times;</button>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="modal-body">
                <div style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", marginBottom: "1rem" }}>
                  Project: <strong>{selectedProject.title}</strong>
                </div>

                <div className="form-section">
                  <div>
                    <label className="field-label">Sanction review decision *</label>
                    <select
                      value={reviewForm.reviewStatus}
                      onChange={(e) => setReviewForm((p) => ({ ...p, reviewStatus: e.target.value }))}
                      className="select-input"
                    >
                      <option value="APPROVED">APPROVED (Sanctioned for recovery)</option>
                      <option value="NEEDS_FURTHER_ASSESSMENT">NEEDS FURTHER ASSESSMENT (Lab testing required)</option>
                      <option value="REJECTED">REJECTED (Contaminated / unsafe)</option>
                      <option value="PENDING">PENDING</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Implementation phase *</label>
                    <select
                      value={reviewForm.implementationStatus}
                      onChange={(e) => setReviewForm((p) => ({ ...p, implementationStatus: e.target.value }))}
                      className="select-input"
                    >
                      <option value="PROPOSED">PROPOSED</option>
                      <option value="UNDER_CONSTRUCTION">UNDER CONSTRUCTION</option>
                      <option value="COMPLETED">COMPLETED (Operational)</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Review justification *</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Roof catchment inspected clean, filtration mesh verified..."
                      value={reviewForm.reviewReason}
                      onChange={(e) => setReviewForm((p) => ({ ...p, reviewReason: e.target.value }))}
                      className="textarea-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Constraints & safety directives</label>
                    <input
                      type="text"
                      placeholder="e.g. Non-potable only; first-flush diverter required"
                      value={reviewForm.constraints}
                      onChange={(e) => setReviewForm((p) => ({ ...p, constraints: e.target.value }))}
                      className="text-input"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save review decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Physical Measurement */}
      {modalMode === "measure" && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 className="panel-title">Log physical meter measurement</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setModalMode(null)}>&times;</button>
            </div>

            <form onSubmit={handleMeasureSubmit}>
              <div className="modal-body">
                <div style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", marginBottom: "1rem" }}>
                  Project: <strong>{selectedProject.title}</strong>
                </div>

                <div className="form-section">
                  <div>
                    <label className="field-label">Physically measured volume (m³) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={measureForm.measuredVolumeM3}
                      onChange={(e) => setMeasureForm((p) => ({ ...p, measuredVolumeM3: e.target.value }))}
                      className="text-input"
                      required
                    />
                    <span className="field-hint">Actual liquid volume measured in physical storage tank</span>
                  </div>

                  <div>
                    <label className="field-label">Instrumentation / measurement method *</label>
                    <input
                      type="text"
                      value={measureForm.method}
                      onChange={(e) => setMeasureForm((p) => ({ ...p, method: e.target.value }))}
                      placeholder="e.g. Calibrated flow meter reading, mechanical pulse meter"
                      className="text-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Measurement timestamp *</label>
                    <input
                      type="datetime-local"
                      value={measureForm.measuredAt}
                      onChange={(e) => setMeasureForm((p) => ({ ...p, measuredAt: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-verified">
                  Commit verified measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
