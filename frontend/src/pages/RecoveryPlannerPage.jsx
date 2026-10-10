import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconLayers,
  IconArrowRight,
  IconPlus,
} from "../components/Icons.jsx";

const DEFAULT_COEFFICIENTS = {
  ROOF: "0.85",
  PAVED_GROUND: "0.75",
  ROAD_SURFACE: "0.70",
  UNPAVED_SOIL: "0.20",
};

export default function RecoveryPlannerPage() {
  const [catchments, setCatchments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("assess"); // "assess" | "catchment" | "rainfall"

  // Assessment form
  const [selectedCatchmentId, setSelectedCatchmentId] = useState("");
  const [rainfallInputMm, setRainfallInputMm] = useState("25.0");
  const [assessSubmitting, setAssessSubmitting] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);

  // Catchment form
  const [catchmentForm, setCatchmentForm] = useState({
    name: "",
    areaSqM: "1200",
    surfaceType: "ROOF",
    runoffCoefficient: "0.85",
    storageCapacityM3: "15.0",
    collectionEfficiency: "0.80",
    proposedUse: "Community groundwater recharge & toilet flushing",
    contaminationFlag: "NONE_DECLARED",
    latitude: 18.5290,
    longitude: 73.8500,
  });

  // Rainfall form
  const [rainfallForm, setRainfallForm] = useState({
    rainfallMm: "25.0",
    locationLabel: "Central Pune Gauge",
    sourceNote: "Verified municipal rain gauge",
    latitude: 18.5290,
    longitude: 73.8500,
    observedAt: new Date().toISOString().slice(0, 16),
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [catchmentList, assessList] = await Promise.all([
        api.catchments(),
        api.assessments(),
      ]);
      setCatchments(catchmentList || []);
      setAssessments(assessList || []);
      if (catchmentList?.length > 0 && !selectedCatchmentId) {
        setSelectedCatchmentId(catchmentList[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load recovery records");
    } finally {
      setLoading(false);
    }
  }

  function handleSurfaceTypeChange(type) {
    setCatchmentForm((prev) => ({
      ...prev,
      surfaceType: type,
      runoffCoefficient: DEFAULT_COEFFICIENTS[type] || "0.80",
      contaminationFlag: type === "ROAD_SURFACE" ? "ROAD_RUNOFF" : prev.contaminationFlag,
    }));
  }

  async function handleCreateCatchment(e) {
    e.preventDefault();
    try {
      const payload = {
        name: catchmentForm.name,
        areaSqM: parseFloat(catchmentForm.areaSqM),
        surfaceType: catchmentForm.surfaceType,
        runoffCoefficient: parseFloat(catchmentForm.runoffCoefficient),
        storageCapacityM3: parseFloat(catchmentForm.storageCapacityM3) || 0,
        collectionEfficiency: parseFloat(catchmentForm.collectionEfficiency) || 0.8,
        proposedUse: catchmentForm.proposedUse || null,
        contaminationFlag: catchmentForm.contaminationFlag,
        latitude: parseFloat(catchmentForm.latitude),
        longitude: parseFloat(catchmentForm.longitude),
      };
      await api.createCatchment(payload);
      setNotification("Catchment structure registered in municipal inventory.");
      setCatchmentForm((p) => ({ ...p, name: "" }));
      loadData();
      setActiveTab("assess");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateRainfall(e) {
    e.preventDefault();
    try {
      const payload = {
        rainfallMm: parseFloat(rainfallForm.rainfallMm),
        locationLabel: rainfallForm.locationLabel || null,
        sourceNote: rainfallForm.sourceNote,
        latitude: parseFloat(rainfallForm.latitude),
        longitude: parseFloat(rainfallForm.longitude),
        observedAt: new Date(rainfallForm.observedAt).toISOString(),
      };
      await api.createRainfall(payload);
      setNotification("Rainfall observation committed to ledger.");
      loadData();
      setActiveTab("assess");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRunAssessment(e) {
    e.preventDefault();
    if (!selectedCatchmentId) {
      setError("Please select a registered catchment.");
      return;
    }
    try {
      setAssessSubmitting(true);
      setError(null);
      const payload = {
        catchmentId: selectedCatchmentId,
        rainfallMm: parseFloat(rainfallInputMm),
      };
      const res = await api.createAssessment(payload);
      setLatestAssessment(res);
      setNotification("Rational assessment calculation complete.");
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAssessSubmitting(false);
    }
  }

  async function handlePromoteToProject(assessmentId) {
    try {
      await api.createProject({
        assessmentId,
        title: `Harvesting Initiative &mdash; Assessment ${assessmentId.slice(0, 8)}`,
      });
      setNotification("Assessment promoted to candidate project in review ledger.");
    } catch (err) {
      setError(err.message);
    }
  }

  // Live dynamic calculation preview
  const currentCatchment = catchments.find((c) => c.id === selectedCatchmentId);
  const pMm = parseFloat(rainfallInputMm) || 0;
  const aSqM = currentCatchment ? parseFloat(currentCatchment.areaSqM) : 0;
  const cCoeff = currentCatchment ? parseFloat(currentCatchment.runoffCoefficient) : 0.8;
  const eff = currentCatchment ? parseFloat(currentCatchment.collectionEfficiency || 0.8) : 0.8;
  const cap = currentCatchment ? parseFloat(currentCatchment.storageCapacityM3 || 0) : 0;

  const previewRunoff = (pMm * aSqM * cCoeff) / 1000;
  const previewCollectible = previewRunoff * eff;
  const previewConstrained = cap > 0 ? Math.min(previewCollectible, cap) : previewCollectible;

  return (
    <div>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Rainwater recovery planning</h1>
          <p className="editorial-subtext">
            Transparent rational method calculations for candidate stormwater harvesting from municipal rooftops and paved grounds.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/recovery/review" className="btn btn-secondary">
            Projects & verification ledger &rarr;
          </Link>
        </div>
      </div>

      {/* Engineering Equation Callout & Safety Directives */}
      <div className="panel" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--water-primary)" }}>
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "0.5rem" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "1.05rem", fontWeight: 600, color: "var(--ink-primary)" }}>
              Rational Hydrological Method: \(V = P \cdot A \cdot C / 1000\)
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--ink-muted)" }}>
              UNITS: P (mm) &bull; A (m²) &bull; C (dimensionless) &bull; V (m³)
            </span>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", marginTop: "0.4rem", lineHeight: 1.5 }}>
            Theoretical runoff is strictly calculated as rainfall depth (\(P\)) over catchment surface (\(A\)) multiplied by runoff coefficient (\(C\)). Yield is constrained by storage capacity (\(S\)) and pre-filter collection efficiency.
          </p>

          <div className="civic-callout warning" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
            <IconAlertTriangle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong>Safety Directive:</strong> Contaminated road runoff or floodwaters are <em>never automatically approved for reuse</em>. Mandatory water quality testing and human engineering review are required.
            </div>
          </div>
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

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.35rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-crisp)", paddingBottom: "0.4rem" }}>
        <button
          className={`btn ${activeTab === "assess" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("assess")}
        >
          1. Calculate recovery assessment
        </button>
        <button
          className={`btn ${activeTab === "catchment" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("catchment")}
        >
          2. Register catchment asset
        </button>
        <button
          className={`btn ${activeTab === "rainfall" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("rainfall")}
        >
          3. Log rainfall observation
        </button>
      </div>

      {/* TAB 1: RUN CALCULATION */}
      {activeTab === "assess" && (
        <div className="split-layout-50-50">
          {/* Assessment Input Form */}
          <form onSubmit={handleRunAssessment} className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Hydrological assessment inputs</h2>
                <span className="panel-sub">Select catchment asset and precipitation depth</span>
              </div>
            </div>

            <div className="panel-body">
              <div className="form-section">
                <div>
                  <label className="field-label">Target catchment asset *</label>
                  {catchments.length === 0 ? (
                    <div className="civic-callout warning">
                      No catchments registered yet. Click the "Register catchment asset" tab above.
                    </div>
                  ) : (
                    <select
                      value={selectedCatchmentId}
                      onChange={(e) => setSelectedCatchmentId(e.target.value)}
                      className="select-input"
                      required
                    >
                      {catchments.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.surfaceType}, {c.areaSqM} m²)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="field-label">Precipitation depth (P in mm) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={rainfallInputMm}
                    onChange={(e) => setRainfallInputMm(e.target.value)}
                    className="text-input"
                    required
                  />
                  <span className="field-hint">Measured rainfall event or design storm value</span>
                </div>

                {/* Calculation Transparency Breakdown */}
                {currentCatchment && (
                  <div style={{ background: "var(--bg-subtle)", border: "1px solid var(--border-light)", padding: "1rem", borderRadius: "var(--radius-xs)" }}>
                    <div style={{ fontSize: "0.74rem", textTransform: "uppercase", fontWeight: 600, color: "var(--ink-muted)", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>
                      Transparent Equation Breakdown
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem", fontSize: "0.8rem", color: "var(--ink-secondary)" }}>
                      <div>Area (\(A\)): <strong>{currentCatchment.areaSqM} m²</strong></div>
                      <div>Coefficient (\(C\)): <strong>{currentCatchment.runoffCoefficient}</strong></div>
                      <div>Efficiency: <strong>{eff}</strong></div>
                      <div>Storage cap: <strong>{cap > 0 ? `${cap} m³` : "Uncapped"}</strong></div>
                    </div>

                    <div style={{ borderTop: "1px dashed var(--border-crisp)", marginTop: "0.75rem", paddingTop: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem" }}>
                        <span>Theoretical runoff (\(V\)):</span>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--ink-primary)" }}>
                          {previewRunoff.toFixed(2)} m³
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", marginTop: "0.2rem" }}>
                        <span>Potentially collectible:</span>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--water-primary)" }}>
                          {previewCollectible.toFixed(2)} m³
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginTop: "0.3rem" }}>
                        <span style={{ fontWeight: 600 }}>Storage-constrained yield:</span>
                        <strong style={{ fontFamily: "var(--font-mono)", color: "var(--verified-ink)" }}>
                          {previewConstrained.toFixed(2)} m³
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%" }}
                  disabled={assessSubmitting || !selectedCatchmentId}
                >
                  {assessSubmitting ? "Calculating..." : "Commit recovery assessment"}
                </button>
              </div>
            </div>
          </form>

          {/* Assessment Results & Register */}
          <div>
            {latestAssessment && (
              <div className="panel" style={{ border: "1px solid var(--water-border)", backgroundColor: "var(--water-tint)" }}>
                <div className="panel-header" style={{ borderBottomColor: "var(--water-border)" }}>
                  <div>
                    <h2 className="panel-title" style={{ color: "var(--water-primary)" }}>Assessment committed</h2>
                    <span className="panel-sub" style={{ fontFamily: "var(--font-mono)" }}>ID: {latestAssessment.id.slice(0, 8)}</span>
                  </div>
                  <span className="status-pill under-review">PENDING REVIEW</span>
                </div>

                <div className="panel-body">
                  <div className="ledger-banner" style={{ marginBottom: "1rem" }}>
                    <div className="ledger-cell" style={{ padding: "0.75rem 1rem" }}>
                      <span className="ledger-cell-title">Theoretical runoff</span>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--water-primary)" }}>
                        {latestAssessment.theoreticalRunoffM3} m³
                      </div>
                    </div>
                    <div className="ledger-cell verified" style={{ padding: "0.75rem 1rem" }}>
                      <span className="ledger-cell-title">Storage constrained</span>
                      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--verified-ink)" }}>
                        {latestAssessment.storageConstrainedM3} m³
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.8rem", color: "var(--ink-secondary)", marginBottom: "0.5rem" }}>
                    <strong>Assumptions:</strong> {latestAssessment.assumptions}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--warning-amber)", marginBottom: "1rem" }}>
                    <strong>Safety Directive:</strong> {latestAssessment.safetyNotes}
                  </p>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePromoteToProject(latestAssessment.id)}
                  >
                    Promote to candidate project in review ledger &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Assessment Log Table */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Historical assessments ({assessments.length})</h2>
                  <span className="panel-sub">Calculated rational method runs</span>
                </div>
              </div>

              {assessments.length === 0 ? (
                <div className="panel-body" style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                  No recovery assessments recorded yet.
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="civic-table">
                    <thead>
                      <tr>
                        <th>Catchment</th>
                        <th>Rainfall</th>
                        <th>Yield (m³)</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong>{a.catchmentName}</strong>
                            {a.syntheticDemo && (
                              <span className="tag-notice" style={{ display: "block", marginTop: "0.15rem", width: "fit-content" }}>
                                DEMO
                              </span>
                            )}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{a.rainfallMm} mm</td>
                          <td>
                            <strong style={{ color: "var(--verified-ink)", fontFamily: "var(--font-mono)" }}>
                              {a.storageConstrainedM3} m³
                            </strong>
                          </td>
                          <td>
                            <span className="status-pill under-review">{a.reviewStatus}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePromoteToProject(a.id)}
                            >
                              Promote &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER CATCHMENT */}
      {activeTab === "catchment" && (
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <form onSubmit={handleCreateCatchment} className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Register municipal catchment asset</h2>
                <span className="panel-sub">Log public rooftops, parking areas, or retention grounds</span>
              </div>
            </div>

            <div className="panel-body">
              <div className="form-section">
                <div>
                  <label className="field-label">Catchment identifier / name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune Municipal Model School Rooftop"
                    value={catchmentForm.name}
                    onChange={(e) => setCatchmentForm((p) => ({ ...p, name: e.target.value }))}
                    className="text-input"
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="field-label">Surface type *</label>
                    <select
                      value={catchmentForm.surfaceType}
                      onChange={(e) => handleSurfaceTypeChange(e.target.value)}
                      className="select-input"
                    >
                      <option value="ROOF">ROOFTOP (C ~ 0.85)</option>
                      <option value="PAVED_GROUND">PAVED GROUND (C ~ 0.75)</option>
                      <option value="ROAD_SURFACE">ROAD SURFACE (C ~ 0.70 - Lab testing required)</option>
                      <option value="UNPAVED_SOIL">UNPAVED SOIL / LAWN (C ~ 0.20)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Catchment surface area (A in m²) *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={catchmentForm.areaSqM}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, areaSqM: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-3">
                  <div>
                    <label className="field-label">Runoff coefficient (C) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.0"
                      max="1.0"
                      value={catchmentForm.runoffCoefficient}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, runoffCoefficient: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Storage capacity (m³)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.0"
                      value={catchmentForm.storageCapacityM3}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, storageCapacityM3: e.target.value }))}
                      className="text-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">Efficiency factor (0.0 - 1.0)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.0"
                      max="1.0"
                      value={catchmentForm.collectionEfficiency}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, collectionEfficiency: e.target.value }))}
                      className="text-input"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="field-label">Contamination classification *</label>
                    <select
                      value={catchmentForm.contaminationFlag}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, contaminationFlag: e.target.value }))}
                      className="select-input"
                    >
                      <option value="NONE_DECLARED">None declared (Standard clean roof)</option>
                      <option value="ROAD_RUNOFF">Road runoff (Heavy oil/grit &bull; Lab test required)</option>
                      <option value="SUSPECTED_SEWAGE_MIX">Suspected sewage mix (Strict review)</option>
                      <option value="SILT_AND_DEBRIS">Silt and debris (Pre-filter mandatory)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Proposed non-potable reuse</label>
                    <input
                      type="text"
                      placeholder="e.g. Garden percolation, municipal tanker filling"
                      value={catchmentForm.proposedUse}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, proposedUse: e.target.value }))}
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
                      value={catchmentForm.latitude}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, latitude: e.target.value }))}
                      className="text-input"
                      style={{ fontFamily: "var(--font-mono)" }}
                      required
                    />
                  </div>
                  <div>
                    <label className="field-label" style={{ fontSize: "0.72rem" }}>Longitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={catchmentForm.longitude}
                      onChange={(e) => setCatchmentForm((p) => ({ ...p, longitude: e.target.value }))}
                      className="text-input"
                      style={{ fontFamily: "var(--font-mono)" }}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Register catchment asset
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LOG RAINFALL */}
      {activeTab === "rainfall" && (
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <form onSubmit={handleCreateRainfall} className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Record precipitation event</h2>
                <span className="panel-sub">Enter gauge reading for hydrological evaluation</span>
              </div>
            </div>

            <div className="panel-body">
              <div className="form-section">
                <div className="form-grid-2">
                  <div>
                    <label className="field-label">Rainfall depth (P in mm) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={rainfallForm.rainfallMm}
                      onChange={(e) => setRainfallForm((p) => ({ ...p, rainfallMm: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="field-label">Observed timestamp *</label>
                    <input
                      type="datetime-local"
                      value={rainfallForm.observedAt}
                      onChange={(e) => setRainfallForm((p) => ({ ...p, observedAt: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Gauge station landmark</label>
                  <input
                    type="text"
                    value={rainfallForm.locationLabel}
                    onChange={(e) => setRainfallForm((p) => ({ ...p, locationLabel: e.target.value }))}
                    placeholder="e.g. Shivajinagar Weather Station"
                    className="text-input"
                  />
                </div>

                <div>
                  <label className="field-label">Measurement method / source note *</label>
                  <input
                    type="text"
                    value={rainfallForm.sourceNote}
                    onChange={(e) => setRainfallForm((p) => ({ ...p, sourceNote: e.target.value }))}
                    placeholder="e.g. Calibrated tipping bucket gauge reading"
                    className="text-input"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                  Commit rainfall observation
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
