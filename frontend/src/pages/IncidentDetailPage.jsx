import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../services/api.js";
import { useActor } from "../hooks/useActor.jsx";
import { createCategoryIcon } from "../utils/leafletIcons.js";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const { actor, isAdmin, isStaff } = useActor();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // AI explanation state
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [explainError, setExplainError] = useState(null);

  // Workflow forms
  const [statusForm, setStatusForm] = useState({ status: "IN_PROGRESS", reason: "" });
  const [assignForm, setAssignForm] = useState({ assigneeActorKey: "demo-inspector", note: "" });
  const [inspectForm, setInspectForm] = useState({ findings: "", suspectedCause: "", inspectedAt: new Date().toISOString().slice(0, 16) });
  const [verifyForm, setVerifyForm] = useState({ outcomeConfirmed: true, notes: "", verifiedAt: new Date().toISOString().slice(0, 16) });

  useEffect(() => {
    loadIncident();
  }, [id]);

  async function loadIncident() {
    try {
      setLoading(true);
      setError(null);
      const res = await api.incident(id);
      setData(res);
      if (res.incident?.status) {
        setStatusForm((prev) => ({ ...prev, status: res.incident.status }));
      }
    } catch (err) {
      setError(err.message || "Failed to load incident");
    } finally {
      setLoading(false);
    }
  }

  async function handleExplain() {
    try {
      setExplaining(true);
      setExplainError(null);
      const res = await api.explain(id);
      setExplanation(res);
    } catch (err) {
      setExplainError(err.message || "Failed to generate explanation");
    } finally {
      setExplaining(false);
    }
  }

  async function handleStatusSubmit(e) {
    e.preventDefault();
    try {
      await api.patchStatus(id, statusForm);
      setActionSuccess("Incident status updated successfully.");
      loadIncident();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAssignSubmit(e) {
    e.preventDefault();
    try {
      await api.assign(id, assignForm);
      setActionSuccess("Inspector assigned successfully.");
      setAssignForm({ assigneeActorKey: "demo-inspector", note: "" });
      loadIncident();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleInspectSubmit(e) {
    e.preventDefault();
    try {
      await api.inspect(id, {
        ...inspectForm,
        inspectedAt: new Date(inspectForm.inspectedAt).toISOString(),
      });
      setActionSuccess("Inspection findings logged successfully.");
      setInspectForm({ findings: "", suspectedCause: "", inspectedAt: new Date().toISOString().slice(0, 16) });
      loadIncident();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVerifySubmit(e) {
    e.preventDefault();
    try {
      await api.verify(id, {
        ...verifyForm,
        verifiedAt: new Date(verifyForm.verifiedAt).toISOString(),
      });
      setActionSuccess("Civic verification logged successfully.");
      setVerifyForm({ outcomeConfirmed: true, notes: "", verifiedAt: new Date().toISOString().slice(0, 16) });
      loadIncident();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="loading-box">
        <div className="spinner"></div>
        <p>Loading incident dossier...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="alert alert-danger">
        <div>
          <strong>Error loading incident:</strong> {error || "Incident not found"}
          <div style={{ marginTop: "0.5rem" }}>
            <Link to="/map" className="btn btn-secondary btn-sm">Return to Map</Link>
          </div>
        </div>
      </div>
    );
  }

  const { incident, reports, assignments, inspections, verifications, statusHistory, nearbyHistory } = data;
  const coords = [parseFloat(incident.latitude), parseFloat(incident.longitude)];

  return (
    <div>
      {/* Breadcrumbs */}
      <div style={{ marginBottom: "1rem", fontSize: "0.85rem", color: "var(--gray-500)" }}>
        <Link to="/">Dashboard</Link> &rsaquo; <Link to="/map">Incidents</Link> &rsaquo; <span>{incident.id.slice(0, 8)}...</span>
      </div>

      {actionSuccess && (
        <div className="alert alert-success" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{actionSuccess}</span>
          <button className="btn btn-sm btn-secondary" onClick={() => setActionSuccess(null)}>Dismiss</button>
        </div>
      )}

      {/* Incident Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className={`badge badge-${incident.category?.toLowerCase()?.replace("_", "-")}`}>
              {incident.category?.replace("_", " ")}
            </span>
            <span className={`badge badge-${incident.status?.toLowerCase()?.replace("_", "-")}`}>
              {incident.status?.replace("_", " ")}
            </span>
            <span className={`badge badge-${incident.severity?.toLowerCase() || "moderate"}`}>
              {incident.severity} SEVERITY
            </span>
            {incident.syntheticDemo && <span className="badge badge-synthetic">DEMO DATA</span>}
          </div>
          <h2>{incident.locationLabel || `Incident at ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`}</h2>
          <p>Location Setting: <strong>{incident.locationType?.replace("_", " ")}</strong> &bull; First recorded: {new Date(incident.firstObservedAt).toLocaleString()}</p>
        </div>

        <div className="header-actions">
          <button className="btn btn-teal" onClick={handleExplain} disabled={explaining}>
            {explaining ? "Consulting AI..." : "Ground with AI Explanation"}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Dossier Details, AI Explanation, Recurrence & History */}
        <div>
          {/* Summary Card */}
          <div className="card">
            <div className="card-header">
              <h3>Incident Overview & Impact</h3>
            </div>
            <p style={{ fontSize: "0.95rem", color: "var(--gray-800)", lineHeight: 1.6 }}>
              {incident.summary}
            </p>
            {incident.recommendedNextAction && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--primary-light)", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--primary)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase" }}>Recommended Next Action:</span>
                <p style={{ fontSize: "0.85rem", color: "var(--primary-dark)", marginTop: "0.2rem" }}>
                  {incident.recommendedNextAction}
                </p>
              </div>
            )}
          </div>

          {/* AI Grounded Explanation Card */}
          {(explanation || explainError) && (
            <div className="card" style={{ border: "2px solid var(--teal)", background: "#f0fdfa" }}>
              <div className="card-header" style={{ borderBottomColor: "#ccfbf1" }}>
                <div>
                  <h3 style={{ color: "#0f766e" }}>Evidence-Grounded AI Analysis</h3>
                  <p style={{ color: "#115e59" }}>
                    Engine: <strong>{explanation?.method || "HYBRID"}</strong>
                    {explanation?.usedFallback && " (Deterministic Fallback)"}
                  </p>
                </div>
                {explanation?.humanReviewRequired && (
                  <span className="badge badge-high">HUMAN REVIEW REQUIRED</span>
                )}
              </div>

              {explainError ? (
                <div className="alert alert-danger">{explainError}</div>
              ) : (
                <div>
                  <div style={{ marginBottom: "1rem" }}>
                    <h4 style={{ fontSize: "0.9rem", color: "#134e4a", marginBottom: "0.3rem" }}>Analysis & Recommendation:</h4>
                    <p style={{ fontSize: "0.9rem", color: "#0f766e", lineHeight: 1.5 }}>
                      {explanation.recommendation}
                    </p>
                  </div>

                  {explanation.supportingEvidence?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <strong style={{ fontSize: "0.8rem", color: "#134e4a" }}>Supporting Grounded Evidence:</strong>
                      <ul style={{ fontSize: "0.8rem", color: "#0f766e", paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
                        {explanation.supportingEvidence.map((ev, i) => <li key={i}>{ev}</li>)}
                      </ul>
                    </div>
                  )}

                  {explanation.missingInformation?.length > 0 && (
                    <div style={{ marginBottom: "0.75rem" }}>
                      <strong style={{ fontSize: "0.8rem", color: "#9a3412" }}>Missing Information Identified:</strong>
                      <ul style={{ fontSize: "0.8rem", color: "#9a3412", paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
                        {explanation.missingInformation.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}

                  <div style={{ fontSize: "0.75rem", color: "#115e59", fontStyle: "italic", marginTop: "0.75rem", borderTop: "1px dashed #99f6e4", paddingTop: "0.5rem" }}>
                    Confidence Note: {explanation.confidenceNote}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Historical Recurrence & Spatial Context */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Historical Recurrence & Spatial Candidates</h3>
                <p>Nearby civic records detecting repeat infrastructure failures</p>
              </div>
            </div>

            <div className="alert alert-info" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
              <strong>Civic Asset Rule:</strong> Proximity signals systemic drainage/pipe stress. JalLoop treats recurrence as priority maintenance evidence, never automatically merging separate civic assets without on-site confirmation.
            </div>

            {nearbyHistory?.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Distance</th>
                      <th>Last Observed</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nearbyHistory.map((nh) => (
                      <tr key={nh.id}>
                        <td>
                          <span className={`badge badge-${nh.category?.toLowerCase()?.replace("_", "-")}`}>
                            {nh.category?.replace("_", " ")}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${nh.status?.toLowerCase()?.replace("_", "-")}`}>
                            {nh.status?.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                          {Math.round(nh.distanceMeters)} m away
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--gray-500)" }}>
                          {new Date(nh.lastObservedAt).toLocaleDateString()}
                        </td>
                        <td>
                          <Link to={`/incidents/${nh.id}`} className="btn btn-secondary btn-sm">
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <p>No prior incidents recorded within this immediate catchment area.</p>
              </div>
            )}
          </div>

          {/* Citizen Reports Log */}
          <div className="card">
            <div className="card-header">
              <h3>Citizen Reports ({reports?.length || 0})</h3>
            </div>
            {reports?.map((rep) => (
              <div key={rep.id} style={{ borderBottom: "1px solid var(--gray-200)", paddingBottom: "0.75rem", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--gray-500)" }}>
                  <span>Reporter: <strong>{rep.reporterDisplayName}</strong></span>
                  <span>{new Date(rep.observedAt).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: "0.875rem", marginTop: "0.4rem", color: "var(--gray-700)" }}>
                  {rep.description}
                </p>
              </div>
            ))}
          </div>

          {/* Status Timeline History */}
          <div className="card">
            <div className="card-header">
              <h3>Status Transition Audit Trail</h3>
            </div>
            <div className="timeline">
              {statusHistory?.map((sh, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-time">{new Date(sh.changedAt).toLocaleString()}</div>
                  <div className="timeline-title">
                    Changed from {sh.fromStatus || "NEW"} &rarr; <strong>{sh.toStatus}</strong>
                  </div>
                  <div className="timeline-desc">
                    By: <em>{sh.changedBy}</em> &bull; Reason: {sh.reason || "None specified"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Administrative Workflows */}
        <div>
          {/* Map Preview */}
          <div className="card" style={{ padding: "0.75rem" }}>
            <div className="map-wrapper" style={{ height: "240px" }}>
              <MapContainer center={coords} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coords} icon={createCategoryIcon(incident.category, incident.severity)}>
                  <Popup>{incident.locationLabel}</Popup>
                </Marker>
              </MapContainer>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--gray-500)", marginTop: "0.5rem", textAlign: "center", fontFamily: "var(--font-mono)" }}>
              GPS: {coords[0].toFixed(7)}, {coords[1].toFixed(7)}
            </div>
          </div>

          {/* Workflow Action Panel */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Administrative Workflow</h3>
                <p>Role: <strong>{actor.label} ({actor.role})</strong></p>
              </div>
            </div>

            {/* 1. Status Update (Staff & Admin) */}
            {isStaff ? (
              <form onSubmit={handleStatusSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Update Incident Status</h4>
                <div className="form-group">
                  <select
                    value={statusForm.status}
                    onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                    className="form-control"
                  >
                    <option value="REPORTED">REPORTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Reason for status change..."
                    value={statusForm.reason}
                    onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                  Save Status Update
                </button>
              </form>
            ) : null}

            {/* 2. Assignment (Admin Only) */}
            {isAdmin ? (
              <form onSubmit={handleAssignSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Assign Field Inspector (Admin)</h4>
                <div className="form-group">
                  <select
                    value={assignForm.assigneeActorKey}
                    onChange={(e) => setAssignForm((p) => ({ ...p, assigneeActorKey: e.target.value }))}
                    className="form-control"
                  >
                    <option value="demo-inspector">Demo Inspector</option>
                    <option value="demo-admin">Demo Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Assignment note / instructions..."
                    value={assignForm.note}
                    onChange={(e) => setAssignForm((p) => ({ ...p, note: e.target.value }))}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                  Assign Field Team
                </button>
              </form>
            ) : null}

            {/* 3. Log Inspection (Staff & Admin) */}
            {isStaff ? (
              <form onSubmit={handleInspectSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--gray-200)", paddingBottom: "1.25rem" }}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Log Site Inspection Findings</h4>
                <div className="form-group">
                  <textarea
                    rows={2}
                    placeholder="Findings on site (e.g. cracked 150mm pipe collar, silt buildup in box drain)..."
                    value={inspectForm.findings}
                    onChange={(e) => setInspectForm((p) => ({ ...p, findings: e.target.value }))}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Suspected cause (e.g. utility trenching damage)..."
                    value={inspectForm.suspectedCause}
                    onChange={(e) => setInspectForm((p) => ({ ...p, suspectedCause: e.target.value }))}
                    className="form-control"
                  />
                </div>
                <button type="submit" className="btn btn-teal btn-sm" style={{ width: "100%" }}>
                  Record Inspection Findings
                </button>
              </form>
            ) : null}

            {/* 4. Verification (Admin Only) */}
            {isAdmin ? (
              <form onSubmit={handleVerifySubmit}>
                <h4 style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>Outcome Verification (Admin)</h4>
                <div className="form-group">
                  <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem" }}>
                    <input
                      type="checkbox"
                      checked={verifyForm.outcomeConfirmed}
                      onChange={(e) => setVerifyForm((p) => ({ ...p, outcomeConfirmed: e.target.checked }))}
                    />
                    Civic outcome confirmed resolved on site
                  </label>
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Verification notes..."
                    value={verifyForm.notes}
                    onChange={(e) => setVerifyForm((p) => ({ ...p, notes: e.target.value }))}
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-emerald btn-sm" style={{ width: "100%" }}>
                  Verify & Certify Completion
                </button>
              </form>
            ) : null}

            {!isStaff && (
              <div className="alert alert-info" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
                You are currently viewing as <strong>{actor.label}</strong>. To assign teams, log inspections, or certify completion, switch to <strong>Inspector</strong> or <strong>Administrator</strong> using the header role selector.
              </div>
            )}
          </div>

          {/* Logged Assignments, Inspections & Verifications */}
          <div className="card">
            <h4 style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>Recorded Civic Milestones</h4>
            {assignments?.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>Assignments:</strong>
                {assignments.map((a) => (
                  <div key={a.id} style={{ fontSize: "0.75rem", color: "var(--gray-700)", marginTop: "0.2rem" }}>
                    &bull; Assigned to <strong>{a.assignee}</strong> by {a.assignedBy}: "{a.note}"
                  </div>
                ))}
              </div>
            )}
            {inspections?.length > 0 && (
              <div style={{ marginBottom: "0.75rem" }}>
                <strong style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>Inspections:</strong>
                {inspections.map((ins) => (
                  <div key={ins.id} style={{ fontSize: "0.75rem", color: "var(--gray-700)", marginTop: "0.2rem" }}>
                    &bull; Inspector <strong>{ins.inspector}</strong>: "{ins.findings}" (Cause: {ins.suspectedCause || "N/A"})
                  </div>
                ))}
              </div>
            )}
            {verifications?.length > 0 && (
              <div>
                <strong style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>Verifications:</strong>
                {verifications.map((v) => (
                  <div key={v.id} style={{ fontSize: "0.75rem", color: "var(--gray-700)", marginTop: "0.2rem" }}>
                    &bull; Certified by <strong>{v.verifier}</strong> ({v.outcomeConfirmed ? "CONFIRMED" : "UNRESOLVED"}): "{v.notes}"
                  </div>
                ))}
              </div>
            )}
            {assignments?.length === 0 && inspections?.length === 0 && verifications?.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--gray-500)" }}>No field actions logged yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
