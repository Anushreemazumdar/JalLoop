import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../services/api.js";
import { useActor } from "../hooks/useActor.jsx";
import { createCategoryIcon } from "../utils/leafletIcons.js";
import {
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconArrowRight,
  IconShield,
  IconUser,
  IconRefresh,
} from "../components/Icons.jsx";

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
        setStatusForm((p) => ({ ...p, status: res.incident.status }));
      }
    } catch (err) {
      setError(err.message || "Failed to load incident dossier");
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
      setExplainError(err.message || "Failed to generate grounded analysis");
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
      setActionSuccess("Field assignment recorded.");
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
      setActionSuccess("Inspection findings committed to ledger.");
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
      setActionSuccess("Outcome verification certified on site.");
      setVerifyForm({ outcomeConfirmed: true, notes: "", verifiedAt: new Date().toISOString().slice(0, 16) });
      loadIncident();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="state-box">
        <div className="spinner-crisp"></div>
        <div className="state-box-title">Loading incident dossier</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="civic-callout danger">
        <div>
          <strong>Error loading incident:</strong> {error || "Incident record not found"}
          <div style={{ marginTop: "0.5rem" }}>
            <Link to="/reports" className="btn btn-secondary btn-sm">
              Return to incident register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { incident, reports, assignments, inspections, verifications, statusHistory, nearbyHistory } = data;
  const coords = [parseFloat(incident.latitude), parseFloat(incident.longitude)];

  return (
    <div>
      {/* Editorial Breadcrumbs & Header */}
      <div style={{ fontSize: "0.78rem", color: "var(--ink-muted)", marginBottom: "0.5rem" }}>
        <Link to="/reports">Incident register</Link> / <span style={{ fontFamily: "var(--font-mono)" }}>{incident.id.slice(0, 8)}</span>
      </div>

      <div className="editorial-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
            <span className={`status-pill ${incident.status?.toLowerCase()?.replace("_", "-")}`}>
              {incident.status?.replace("_", " ")}
            </span>
            <span className={`priority-flag ${incident.severity?.toLowerCase() || "moderate"}`}>
              {incident.severity} PRIORITY
            </span>
            {incident.syntheticDemo && (
              <span className="tag-notice">SYNTHETIC DEMO</span>
            )}
          </div>
          <h1 className="editorial-title">
            {incident.locationLabel || `Incident at ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`}
          </h1>
          <p className="editorial-subtext">
            Category: <strong>{incident.category?.replace("_", " ")}</strong> &bull; Setting: <strong>{incident.locationType?.replace("_", " ")}</strong>
          </p>
        </div>

        <div className="header-action-row">
          <button className="btn btn-secondary" onClick={handleExplain} disabled={explaining}>
            <IconShield size={14} />
            {explaining ? "Consulting evidence..." : "Evidence-grounded analysis"}
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="civic-callout success">
          <IconCheckCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Asymmetric Dossier Split Screen */}
      <div className="split-layout-65-35">
        {/* Left Column: Physical Observations, Grounded Recommendations, History Timeline, Recurrence */}
        <div>
          {/* Section 1: Observed Physical Record */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Observed physical record</h2>
              <span className="panel-sub">Raw field report and community observations</span>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: "0.92rem", color: "var(--ink-primary)", lineHeight: 1.6, marginBottom: "1rem" }}>
                {incident.summary}
              </p>

              <div className="dossier-meta-grid">
                <div className="dossier-meta-item">
                  <label>First observed</label>
                  <span>{new Date(incident.firstObservedAt).toLocaleString()}</span>
                </div>
                <div className="dossier-meta-item">
                  <label>GPS Coordinates</label>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                    {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
                  </span>
                </div>
                <div className="dossier-meta-item">
                  <label>Citizen reports logged</label>
                  <span>{reports?.length || 1} report{reports?.length === 1 ? "" : "s"}</span>
                </div>
                <div className="dossier-meta-item">
                  <label>Recurrence candidate</label>
                  <span>{incident.suspectedDuplicate ? "Yes (Within radius)" : "No"}</span>
                </div>
              </div>

              {incident.recommendedNextAction && (
                <div style={{ background: "var(--bg-subtle)", padding: "0.85rem", borderLeft: "3px solid var(--water-primary)", borderRadius: "var(--radius-xs)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", color: "var(--water-primary)", letterSpacing: "0.04em" }}>
                    Operational recommendation
                  </div>
                  <div style={{ fontSize: "0.84rem", color: "var(--ink-primary)", marginTop: "0.25rem" }}>
                    {incident.recommendedNextAction}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: AI Grounded Explanation (Separated from observed facts) */}
          {(explanation || explainError) && (
            <div className="panel" style={{ border: "1px solid var(--water-border)", backgroundColor: "var(--water-tint)" }}>
              <div className="panel-header" style={{ borderBottomColor: "var(--water-border)" }}>
                <div>
                  <h2 className="panel-title" style={{ color: "var(--water-primary)" }}>
                    Evidence-grounded recommendation
                  </h2>
                  <span className="panel-sub">
                    Method: <strong>{explanation?.method || "HYBRID"}</strong>
                    {explanation?.usedFallback && " (Deterministic Heuristic)"}
                  </span>
                </div>
                <span className="priority-flag moderate">HUMAN REVIEW REQUIRED</span>
              </div>

              <div className="panel-body">
                {explainError ? (
                  <div className="civic-callout danger">{explainError}</div>
                ) : (
                  <div>
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600, color: "var(--water-primary)", letterSpacing: "0.04em" }}>
                        Synthesized Recommendation
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--ink-primary)", marginTop: "0.25rem", lineHeight: 1.5 }}>
                        {explanation.recommendation}
                      </p>
                    </div>

                    {explanation.supportingEvidence?.length > 0 && (
                      <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600, color: "var(--ink-muted)", letterSpacing: "0.04em" }}>
                          Supporting Grounded Evidence
                        </div>
                        <ul style={{ fontSize: "0.82rem", color: "var(--ink-secondary)", paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
                          {explanation.supportingEvidence.map((ev, i) => (
                            <li key={i}>{ev}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {explanation.missingInformation?.length > 0 && (
                      <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600, color: "var(--warning-amber)", letterSpacing: "0.04em" }}>
                          Missing Evidence Identified
                        </div>
                        <ul style={{ fontSize: "0.82rem", color: "var(--warning-amber)", paddingLeft: "1.2rem", marginTop: "0.25rem" }}>
                          {explanation.missingInformation.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div style={{ fontSize: "0.74rem", color: "var(--ink-muted)", fontStyle: "italic", borderTop: "1px dashed var(--water-border)", paddingTop: "0.5rem" }}>
                      Confidence: {explanation.confidenceNote}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 3: History & Audit Timeline */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Audit trail & operational milestones</h2>
              <span className="panel-sub">Verified timeline of reports, inspections, and status changes</span>
            </div>
            <div className="panel-body">
              <div className="audit-timeline">
                {/* 1. Initial observation */}
                <div className="audit-node">
                  <span className="audit-stamp">{new Date(incident.firstObservedAt).toLocaleString()}</span>
                  <div className="audit-heading">Incident record created</div>
                  <div className="audit-body">Initial status set to {incident.status}</div>
                </div>

                {/* 2. Status changes */}
                {statusHistory?.map((sh, idx) => (
                  <div key={idx} className="audit-node">
                    <span className="audit-stamp">{new Date(sh.changedAt).toLocaleString()}</span>
                    <div className="audit-heading">Status transitioned to {sh.toStatus}</div>
                    <div className="audit-body">
                      Changed by: <em>{sh.changedBy}</em> &bull; Reason: {sh.reason || "None specified"}
                    </div>
                  </div>
                ))}

                {/* 3. Assignments */}
                {assignments?.map((a) => (
                  <div key={a.id} className="audit-node">
                    <span className="audit-stamp">{new Date(a.createdAt).toLocaleString()}</span>
                    <div className="audit-heading">Assigned to field team</div>
                    <div className="audit-body">
                      Assignee: <strong>{a.assignee}</strong> (Assigned by {a.assignedBy}) &bull; Instructions: "{a.note}"
                    </div>
                  </div>
                ))}

                {/* 4. Inspections */}
                {inspections?.map((ins) => (
                  <div key={ins.id} className="audit-node">
                    <span className="audit-stamp">{new Date(ins.inspectedAt).toLocaleString()}</span>
                    <div className="audit-heading">Site inspection recorded</div>
                    <div className="audit-body">
                      Inspector: <strong>{ins.inspector}</strong><br />
                      Findings: {ins.findings}<br />
                      Suspected cause: <em>{ins.suspectedCause || "Under evaluation"}</em>
                    </div>
                  </div>
                ))}

                {/* 5. Verifications */}
                {verifications?.map((v) => (
                  <div key={v.id} className="audit-node">
                    <span className="audit-stamp">{new Date(v.verifiedAt).toLocaleString()}</span>
                    <div className="audit-heading">
                      Physical outcome verification: {v.outcomeConfirmed ? "CERTIFIED RESOLVED" : "UNRESOLVED"}
                    </div>
                    <div className="audit-body">
                      Certified by: <strong>{v.verifier}</strong> &bull; Verification notes: "{v.notes}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Historical Recurrence */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Spatial recurrence candidates ({nearbyHistory?.length || 0})</h2>
                <span className="panel-sub">Historical failure records in proximate radius</span>
              </div>
            </div>
            <div className="panel-body">
              <p style={{ fontSize: "0.8rem", color: "var(--ink-secondary)", marginBottom: "0.75rem" }}>
                Nearby incidents indicate recurring infrastructure vulnerability. To prevent accidental loss of field evidence, proximity records are never merged automatically.
              </p>

              {nearbyHistory?.length > 0 ? (
                <div className="table-wrap">
                  <table className="civic-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Distance</th>
                        <th>Observed</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nearbyHistory.map((nh) => (
                        <tr key={nh.id}>
                          <td>
                            <span className="category-tag">{nh.category?.replace("_", " ")}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${nh.status?.toLowerCase()?.replace("_", "-")}`}>
                              {nh.status}
                            </span>
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                            {Math.round(nh.distanceMeters)} m
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--ink-muted)" }}>
                            {new Date(nh.lastObservedAt).toLocaleDateString()}
                          </td>
                          <td>
                            <Link to={`/incidents/${nh.id}`} className="btn btn-secondary btn-sm">
                              Inspect &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ color: "var(--ink-muted)", fontSize: "0.82rem" }}>
                  No previous incidents recorded in this immediate radius.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Location Map & Operational Actions */}
        <div>
          {/* Map Preview Surface */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Location preview</h2>
            </div>
            <div style={{ height: "220px", overflow: "hidden", position: "relative" }}>
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
            <div style={{ padding: "0.75rem", fontSize: "0.75rem", color: "var(--ink-muted)", textAlign: "center", fontFamily: "var(--font-mono)", borderTop: "1px solid var(--border-light)" }}>
              GPS: {coords[0].toFixed(6)}, {coords[1].toFixed(6)}
            </div>
          </div>

          {/* Operational Workflow Action Panel */}
          <div className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Field operations</h2>
                <span className="panel-sub">Active role: <strong>{actor.label} ({actor.role})</strong></span>
              </div>
            </div>

            <div className="panel-body">
              {/* Status Update Form (Staff / Admin) */}
              {isStaff && (
                <form onSubmit={handleStatusSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "1.25rem" }}>
                  <label className="field-label">Update status</label>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                      className="select-input"
                    >
                      <option value="REPORTED">REPORTED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Reason for change..."
                      value={statusForm.reason}
                      onChange={(e) => setStatusForm((p) => ({ ...p, reason: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                    Commit status transition
                  </button>
                </form>
              )}

              {/* Inspector Assignment (Admin only) */}
              {isAdmin && (
                <form onSubmit={handleAssignSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "1.25rem" }}>
                  <label className="field-label">Assign inspector (Administrator)</label>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <select
                      value={assignForm.assigneeActorKey}
                      onChange={(e) => setAssignForm((p) => ({ ...p, assigneeActorKey: e.target.value }))}
                      className="select-input"
                    >
                      <option value="demo-inspector">Demo Inspector</option>
                      <option value="demo-admin">Demo Admin</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Assignment instructions..."
                      value={assignForm.note}
                      onChange={(e) => setAssignForm((p) => ({ ...p, note: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ width: "100%" }}>
                    Dispatch assignment
                  </button>
                </form>
              )}

              {/* Log Inspection (Staff & Admin) */}
              {isStaff && (
                <form onSubmit={handleInspectSubmit} style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "1.25rem" }}>
                  <label className="field-label">Log inspection findings</label>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <textarea
                      rows={2}
                      placeholder="Observed site findings (e.g. cracked pipe collar, culvert silting)..."
                      value={inspectForm.findings}
                      onChange={(e) => setInspectForm((p) => ({ ...p, findings: e.target.value }))}
                      className="textarea-input"
                      required
                    />
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Suspected root cause..."
                      value={inspectForm.suspectedCause}
                      onChange={(e) => setInspectForm((p) => ({ ...p, suspectedCause: e.target.value }))}
                      className="text-input"
                    />
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
                    Record site inspection
                  </button>
                </form>
              )}

              {/* Verify Outcome (Admin only) */}
              {isAdmin && (
                <form onSubmit={handleVerifySubmit}>
                  <label className="field-label">Certify verification (Administrator)</label>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--ink-primary)" }}>
                      <input
                        type="checkbox"
                        checked={verifyForm.outcomeConfirmed}
                        onChange={(e) => setVerifyForm((p) => ({ ...p, outcomeConfirmed: e.target.checked }))}
                      />
                      Physically confirmed resolved on site
                    </label>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Verification certification notes..."
                      value={verifyForm.notes}
                      onChange={(e) => setVerifyForm((p) => ({ ...p, notes: e.target.value }))}
                      className="text-input"
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-verified btn-sm" style={{ width: "100%" }}>
                    <IconCheckCircle size={13} /> Certify resolution
                  </button>
                </form>
              )}

              {!isStaff && (
                <div style={{ fontSize: "0.8rem", color: "var(--ink-muted)", fontStyle: "italic" }}>
                  Viewing as Citizen. To execute administrative dispatches or site certifications, switch your role in the top header.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
