import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useActor } from "../hooks/useActor.jsx";

export default function RecoveryReviewPage() {
  const { actor, isAdmin, isStaff } = useActor();

  const [projects, setProjects] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  // Selected project for modal action
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
    method: "Flow meter reading at storage tank outlet",
    measuredAt: new Date().toISOString().slice(0, 16),
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
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
      setError(err.message || "Failed to load recovery review data");
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
      setNotification(`Project "${selectedProject.title}" review updated successfully.`);
      setModalMode(null);
      loadData();
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
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  // Calculate volume totals across lifecycle stages
  const estimatedVol = overview?.estimatedPotentiallyRecoverableM3 ?? 0;
  const verifiedVol = overview?.verifiedRecoveredM3 ?? 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Recovery Governance & Physical Verification Ledger</h2>
          <p>
            Enforce human oversight, safety classifications, and physical meter verifications before claiming civic water recovery.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/recovery" className="btn btn-secondary">
            &larr; Recovery Calculator
          </Link>
        </div>
      </div>

      {notification && (
        <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{notification}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setNotification(null)}>Dismiss</button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* 4-Stage Lifecycle Volume Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        <div className="stat-card primary">
          <div className="stat-card-title">1. Estimated Runoff</div>
          <div className="stat-card-value">{estimatedVol} m³</div>
          <div className="stat-card-subtext">Rational method \(V = P \cdot A \cdot C / 1000\)</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-card-title">2. Approved Projects</div>
          <div className="stat-card-value">
            {projects.filter((p) => p.reviewStatus === "APPROVED").length}
          </div>
          <div className="stat-card-subtext">Human sanctioned for implementation</div>
        </div>

        <div className="stat-card amber">
          <div className="stat-card-title">3. Active Installations</div>
          <div className="stat-card-value">
            {projects.filter((p) => p.implementationStatus === "COMPLETED" || p.implementationStatus === "UNDER_CONSTRUCTION").length}
          </div>
          <div className="stat-card-subtext">Constructed / operational tanks</div>
        </div>

        <div className="stat-card emerald">
          <div className="stat-card-title">4. Verified Water Recovered</div>
          <div className="stat-card-value">{verifiedVol} m³</div>
          <div className="stat-card-subtext">Metered on site (never modelled)</div>
        </div>
      </div>

      {/* Transparency Banner */}
      <div className="alert alert-info">
        <strong>The JalLoop Verification Commitment:</strong> We never treat estimated or modelled rainwater as recovered water. Water is only marked "Verified" when field inspectors log calibrated meter readings or tank gauge dip measurements.
      </div>

      {/* Projects Ledger */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Recovery Projects Ledger ({projects.length})</h3>
            <p>Sanctioned civic rainwater harvesting initiatives</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-box">
            <div className="spinner"></div>
            <p>Loading project ledger...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <h4>No Recovery Projects Yet</h4>
            <p>Generate an assessment in the Recovery Calculator tab, then promote it to candidate project.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Title</th>
                  <th>Review Status</th>
                  <th>Implementation</th>
                  <th>Constraints & Safety</th>
                  <th>Verified Measurements</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontFamily: "var(--font-mono)" }}>
                        Assessment: {p.assessmentId?.slice(0, 8)}...
                      </div>
                      {p.syntheticDemo && (
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
                            p.reviewStatus === "APPROVED"
                              ? "var(--emerald-light)"
                              : p.reviewStatus === "REJECTED"
                              ? "var(--rose-light)"
                              : "var(--amber-light)",
                          color:
                            p.reviewStatus === "APPROVED"
                              ? "var(--emerald)"
                              : p.reviewStatus === "REJECTED"
                              ? "var(--rose)"
                              : "var(--amber)",
                        }}
                      >
                        {p.reviewStatus}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-in-progress">
                        {p.implementationStatus}
                      </span>
                    </td>
                    <td style={{ maxWidth: "220px", fontSize: "0.8rem", color: "var(--gray-600)" }}>
                      {p.constraints || p.reviewReason || "None recorded"}
                    </td>
                    <td>
                      {p.measurements?.length > 0 ? (
                        <div>
                          {p.measurements.map((m) => (
                            <div key={m.id} style={{ fontSize: "0.8rem" }}>
                              <strong style={{ color: "var(--emerald)" }}>{m.measuredVolumeM3} m³</strong>
                              <span style={{ color: "var(--gray-500)", fontSize: "0.75rem", marginLeft: "0.3rem" }}>
                                ({m.method})
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--gray-400)" }}>None recorded</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {isStaff && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openReviewModal(p)}
                            title="Update review decision"
                          >
                            Review
                          </button>
                        )}
                        <button
                          className="btn btn-teal btn-sm"
                          onClick={() => openMeasureModal(p)}
                          title="Log physical meter measurement"
                        >
                          + Log Meter
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

      {/* MODAL 1: REVIEW PROJECT */}
      {modalMode === "review" && selectedProject && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "550px", width: "100%", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header">
              <h3>Human Governance Review</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setModalMode(null)}>&times;</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
              Project: <strong>{selectedProject.title}</strong>
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label>Sanction / Review Decision *</label>
                <select
                  value={reviewForm.reviewStatus}
                  onChange={(e) => setReviewForm((p) => ({ ...p, reviewStatus: e.target.value }))}
                  className="form-control"
                >
                  <option value="APPROVED">APPROVED (Sanctioned for recovery)</option>
                  <option value="NEEDS_FURTHER_ASSESSMENT">NEEDS FURTHER ASSESSMENT (Lab test / site check needed)</option>
                  <option value="REJECTED">REJECTED (Contaminated / unsafe)</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div className="form-group">
                <label>Implementation Phase *</label>
                <select
                  value={reviewForm.implementationStatus}
                  onChange={(e) => setReviewForm((p) => ({ ...p, implementationStatus: e.target.value }))}
                  className="form-control"
                >
                  <option value="PROPOSED">PROPOSED</option>
                  <option value="UNDER_CONSTRUCTION">UNDER CONSTRUCTION</option>
                  <option value="COMPLETED">COMPLETED (Operational)</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="form-group">
                <label>Review Reason / Justification *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Roof catchment inspected clean, filtration mesh verified..."
                  value={reviewForm.reviewReason}
                  onChange={(e) => setReviewForm((p) => ({ ...p, reviewReason: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Engineering Constraints & Water Quality Directives</label>
                <input
                  type="text"
                  placeholder="e.g. Non-potable only; first-flush diverter required"
                  value={reviewForm.constraints}
                  onChange={(e) => setReviewForm((p) => ({ ...p, constraints: e.target.value }))}
                  className="form-control"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Review Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG PHYSICAL MEASUREMENT */}
      {modalMode === "measure" && selectedProject && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 2000, padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "550px", width: "100%", margin: 0, maxHeight: "90vh", overflowY: "auto" }}>
            <div className="card-header">
              <h3>Log Physical Recovery Verification</h3>
              <button className="btn btn-sm btn-secondary" onClick={() => setModalMode(null)}>&times;</button>
            </div>
            <p style={{ fontSize: "0.85rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
              Project: <strong>{selectedProject.title}</strong>
            </p>

            <form onSubmit={handleMeasureSubmit}>
              <div className="form-group">
                <label>Physically Measured Volume (m³) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={measureForm.measuredVolumeM3}
                  onChange={(e) => setMeasureForm((p) => ({ ...p, measuredVolumeM3: e.target.value }))}
                  className="form-control"
                  required
                />
                <span className="form-help">Actual water measured in storage tank</span>
              </div>

              <div className="form-group">
                <label>Measurement Instrumentation / Method *</label>
                <input
                  type="text"
                  value={measureForm.method}
                  onChange={(e) => setMeasureForm((p) => ({ ...p, method: e.target.value }))}
                  placeholder="e.g. Ultrasonic tank level sensor, manual dipstick rod, mechanical water meter"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Timestamp of Field Measurement *</label>
                <input
                  type="datetime-local"
                  value={measureForm.measuredAt}
                  onChange={(e) => setMeasureForm((p) => ({ ...p, measuredAt: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.25rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-emerald">
                  Commit Verified Volume
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
