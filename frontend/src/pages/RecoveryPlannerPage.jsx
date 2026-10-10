import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

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

  // Forms
  const [activeTab, setActiveTab] = useState("assess"); // "assess" | "catchment" | "rainfall"

  // 1. Assessment Form
  const [selectedCatchmentId, setSelectedCatchmentId] = useState("");
  const [rainfallInputMm, setRainfallInputMm] = useState("25.0");
  const [assessSubmitting, setAssessSubmitting] = useState(false);
  const [latestAssessment, setLatestAssessment] = useState(null);

  // 2. Catchment Form
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

  // 3. Rainfall Form
  const [rainfallForm, setRainfallForm] = useState({
    rainfallMm: "25.0",
    locationLabel: "Central Pune Gauge",
    sourceNote: "User verified local rain gauge",
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
      setError(err.message || "Failed to load recovery data");
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
      setNotification("Catchment structure registered successfully.");
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
      setNotification("Rainfall observation logged successfully.");
      loadData();
      setActiveTab("assess");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRunAssessment(e) {
    e.preventDefault();
    if (!selectedCatchmentId) {
      setError("Please select or register a catchment first.");
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
      setNotification("Recovery calculation completed!");
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
        title: `Harvesting Initiative — Assessment ${assessmentId.slice(0, 8)}`,
      });
      setNotification("Assessment promoted to candidate Recovery Project! View in Project Review tab.");
    } catch (err) {
      setError(err.message);
    }
  }

  // Live theoretical preview calculation
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
      <div className="page-header">
        <div>
          <h2>Rainwater Recovery Calculator & Assessment</h2>
          <p>
            Estimate candidate runoff from municipal roofs and paved surfaces using deterministic hydrological equations.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/recovery/review" className="btn btn-secondary">
            Project Review & Verification &rarr;
          </Link>
        </div>
      </div>

      {/* Hydrology Formula & Safety Callout */}
      <div className="card" style={{ background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", border: "1px solid #99f6e4" }}>
        <h3 style={{ color: "var(--primary-dark)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
          Standard Rational Hydrology Formula: \(V = P \times A \times C / 1000\)
        </h3>
        <p style={{ fontSize: "0.875rem", color: "var(--gray-700)", lineHeight: 1.6 }}>
          Where <strong>\(P\)</strong> is rainfall in millimetres, <strong>\(A\)</strong> is catchment area in square metres, <strong>\(C\)</strong> is dimensionless runoff coefficient, and <strong>\(V\)</strong> is theoretical runoff volume in cubic metres (\(m^3\)).
        </p>
        <div className="alert alert-warning" style={{ marginTop: "0.75rem", marginBottom: 0 }}>
          <strong>Critical Safety Directive:</strong> Road runoff or floodwater carries heavy oil, grit, and contamination. <em>JalLoop never automatically approves contaminated runoff for reuse.</em> Mandatory human lab testing and engineering review are required.
        </div>
      </div>

      {notification && (
        <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{notification}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setNotification(null)}>Dismiss</button>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "0.5rem" }}>
        <button
          className={`btn ${activeTab === "assess" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("assess")}
        >
          1. Calculate Recovery
        </button>
        <button
          className={`btn ${activeTab === "catchment" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("catchment")}
        >
          2. Register Catchment
        </button>
        <button
          className={`btn ${activeTab === "rainfall" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setActiveTab("rainfall")}
        >
          3. Log Rainfall Observation
        </button>
      </div>

      {/* TAB 1: CALCULATE RECOVERY */}
      {activeTab === "assess" && (
        <div className="grid-2">
          {/* Assessment Trigger Form */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Hydrological Assessment Input</h3>
                <p>Select asset catchment and precipitation</p>
              </div>
            </div>

            <form onSubmit={handleRunAssessment}>
              <div className="form-group">
                <label>Select Target Catchment *</label>
                {catchments.length === 0 ? (
                  <div className="alert alert-warning" style={{ fontSize: "0.85rem" }}>
                    No catchments registered yet. Please click the "Register Catchment" tab above.
                  </div>
                ) : (
                  <select
                    value={selectedCatchmentId}
                    onChange={(e) => setSelectedCatchmentId(e.target.value)}
                    className="form-control"
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

              <div className="form-group">
                <label>Rainfall Depth (P in mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={rainfallInputMm}
                  onChange={(e) => setRainfallInputMm(e.target.value)}
                  className="form-control"
                  required
                />
                <span className="form-help">Observed or forecasted rainfall event</span>
              </div>

              {/* Dynamic Live Calculation Preview Card */}
              {currentCatchment && (
                <div style={{ background: "var(--gray-50)", border: "1px solid var(--gray-200)", padding: "1rem", borderRadius: "var(--radius-sm)", marginBottom: "1.25rem" }}>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--gray-700)", marginBottom: "0.5rem" }}>Live Rational Method Estimation:</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.8rem" }}>
                    <div>Catchment Area (\(A\)): <strong>{currentCatchment.areaSqM} m²</strong></div>
                    <div>Runoff Coeff (\(C\)): <strong>{currentCatchment.runoffCoefficient}</strong></div>
                    <div>Collection Efficiency: <strong>{eff}</strong></div>
                    <div>Storage Cap: <strong>{cap > 0 ? `${cap} m³` : "Uncapped"}</strong></div>
                  </div>

                  <div style={{ marginTop: "0.75rem", borderTop: "1px dashed var(--gray-300)", paddingTop: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                      <span>Theoretical Runoff (\(V\)):</span>
                      <strong style={{ color: "var(--primary-dark)" }}>{previewRunoff.toFixed(2)} m³</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      <span>Potentially Collectible:</span>
                      <strong style={{ color: "var(--teal)" }}>{previewCollectible.toFixed(2)} m³</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                      <span>Storage-Constrained Yield:</span>
                      <strong style={{ color: "var(--emerald)" }}>{previewConstrained.toFixed(2)} m³</strong>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-teal"
                style={{ width: "100%" }}
                disabled={assessSubmitting || !selectedCatchmentId}
              >
                {assessSubmitting ? "Computing Hydrology..." : "Generate Official Assessment Record"}
              </button>
            </form>
          </div>

          {/* Assessment Result or Historical Assessments */}
          <div>
            {latestAssessment && (
              <div className="card" style={{ border: "2px solid var(--teal)" }}>
                <div className="card-header">
                  <div>
                    <h3 style={{ color: "var(--teal)" }}>Assessment Record Created</h3>
                    <p>Canonical ID: {latestAssessment.id}</p>
                  </div>
                  <span className="badge badge-under-review">PENDING REVIEW</span>
                </div>

                <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className="stat-card" style={{ padding: "0.75rem" }}>
                    <div className="stat-card-title">Theoretical Runoff</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--primary)" }}>
                      {latestAssessment.theoreticalRunoffM3} m³
                    </div>
                  </div>
                  <div className="stat-card" style={{ padding: "0.75rem" }}>
                    <div className="stat-card-title">Storage Constrained</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--emerald)" }}>
                      {latestAssessment.storageConstrainedM3} m³
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "var(--gray-600)", marginBottom: "0.75rem" }}>
                  <strong>Assumptions:</strong> {latestAssessment.assumptions}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#9a3412", marginBottom: "1rem" }}>
                  <strong>Safety Notice:</strong> {latestAssessment.safetyNotes}
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handlePromoteToProject(latestAssessment.id)}
                >
                  Promote to Recovery Project Candidate &rarr;
                </button>
              </div>
            )}

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Logged Assessments ({assessments.length})</h3>
                  <p>Historical rational method analyses</p>
                </div>
              </div>

              {assessments.length === 0 ? (
                <div className="empty-state">
                  <p>No recovery assessments recorded yet.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Catchment</th>
                        <th>Rainfall</th>
                        <th>Runoff / Yield</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessments.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong>{a.catchmentName}</strong>
                            {a.syntheticDemo && <span className="badge badge-synthetic" style={{ marginLeft: "0.3rem" }}>DEMO</span>}
                          </td>
                          <td>{a.rainfallMm} mm</td>
                          <td>
                            <span title="Theoretical">{a.theoreticalRunoffM3} m³ (theor)</span><br />
                            <strong style={{ color: "var(--emerald)" }}>{a.storageConstrainedM3} m³ (yield)</strong>
                          </td>
                          <td>
                            <span className="badge badge-under-review">{a.reviewStatus}</span>
                          </td>
                          <td>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePromoteToProject(a.id)}
                            >
                              Promote
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
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <form onSubmit={handleCreateCatchment} className="card">
            <div className="card-header">
              <div>
                <h3>Register Water Catchment Asset</h3>
                <p>Register school roofs, parking pavements, or housing society basins</p>
              </div>
            </div>

            <div className="form-group">
              <label>Catchment Name / Identifier *</label>
              <input
                type="text"
                placeholder="e.g. Pune Municipal Model School Rooftop"
                value={catchmentForm.name}
                onChange={(e) => setCatchmentForm((p) => ({ ...p, name: e.target.value }))}
                className="form-control"
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Surface Type *</label>
                <select
                  value={catchmentForm.surfaceType}
                  onChange={(e) => handleSurfaceTypeChange(e.target.value)}
                  className="form-control"
                >
                  <option value="ROOF">ROOF (C ~ 0.85)</option>
                  <option value="PAVED_GROUND">PAVED GROUND (C ~ 0.75)</option>
                  <option value="ROAD_SURFACE">ROAD SURFACE (C ~ 0.70)</option>
                  <option value="UNPAVED_SOIL">UNPAVED SOIL / LAWN (C ~ 0.20)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Catchment Area (A in m²) *</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={catchmentForm.areaSqM}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, areaSqM: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label>Runoff Coefficient (C: 0.0 - 1.0) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={catchmentForm.runoffCoefficient}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, runoffCoefficient: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Storage Capacity (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.0"
                  value={catchmentForm.storageCapacityM3}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, storageCapacityM3: e.target.value }))}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Collection Efficiency (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={catchmentForm.collectionEfficiency}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, collectionEfficiency: e.target.value }))}
                  className="form-control"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Contamination Classification *</label>
                <select
                  value={catchmentForm.contaminationFlag}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, contaminationFlag: e.target.value }))}
                  className="form-control"
                >
                  <option value="NONE_DECLARED">None Declared (Clean roof)</option>
                  <option value="ROAD_RUNOFF">Road Runoff (Heavy oil/grit - Lab review required)</option>
                  <option value="SUSPECTED_SEWAGE_MIX">Suspected Sewage Mix (Strict human review)</option>
                  <option value="SILT_AND_DEBRIS">Silt & Debris (Pre-filtration required)</option>
                  <option value="INDUSTRIAL_DRAINAGE">Industrial Drainage (Prohibited reuse)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Proposed Non-Potable Use</label>
                <input
                  type="text"
                  placeholder="e.g. Garden watering, toilet flushing, groundwater percolation"
                  value={catchmentForm.proposedUse}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, proposedUse: e.target.value }))}
                  className="form-control"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={catchmentForm.latitude}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, latitude: e.target.value }))}
                  className="form-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={catchmentForm.longitude}
                  onChange={(e) => setCatchmentForm((p) => ({ ...p, longitude: e.target.value }))}
                  className="form-control"
                  style={{ fontFamily: "var(--font-mono)" }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Register Catchment
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LOG RAINFALL */}
      {activeTab === "rainfall" && (
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <form onSubmit={handleCreateRainfall} className="card">
            <div className="card-header">
              <div>
                <h3>Record Rainfall Event</h3>
                <p>Enter precipitation measurement from local gauge or station</p>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Rainfall Depth (mm) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={rainfallForm.rainfallMm}
                  onChange={(e) => setRainfallForm((p) => ({ ...p, rainfallMm: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Observed Date & Time *</label>
                <input
                  type="datetime-local"
                  value={rainfallForm.observedAt}
                  onChange={(e) => setRainfallForm((p) => ({ ...p, observedAt: e.target.value }))}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Gauge Location Label</label>
              <input
                type="text"
                value={rainfallForm.locationLabel}
                onChange={(e) => setRainfallForm((p) => ({ ...p, locationLabel: e.target.value }))}
                placeholder="e.g. Shivajinagar Weather Station gauge"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Source / Method Note *</label>
              <input
                type="text"
                value={rainfallForm.sourceNote}
                onChange={(e) => setRainfallForm((p) => ({ ...p, sourceNote: e.target.value }))}
                placeholder="e.g. Citizen manual rain gauge measurement"
                className="form-control"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Save Rainfall Record
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
