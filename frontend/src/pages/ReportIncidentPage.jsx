import { useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { api } from "../services/api.js";
import { createCategoryIcon } from "../utils/leafletIcons.js";
import {
  IconCheckCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconPlus,
} from "../components/Icons.jsx";

function LocationPickerMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={createCategoryIcon("WATERLOGGING", "HIGH")} /> : null;
}

export default function ReportIncidentPage() {
  const defaultCoords = [18.5204, 73.8567]; // Pune center
  const [coords, setCoords] = useState(defaultCoords);

  const [form, setForm] = useState({
    category: "WATERLOGGING",
    severity: "HIGH",
    locationType: "ROAD",
    locationLabel: "",
    description: "",
    observedAt: new Date().toISOString().slice(0, 16),
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) {
      setError("Please describe the physical conditions observed on site.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        category: form.category,
        severity: form.severity,
        locationType: form.locationType,
        locationLabel: form.locationLabel || null,
        description: form.description,
        latitude: parseFloat(coords[0].toFixed(7)),
        longitude: parseFloat(coords[1].toFixed(7)),
        observedAt: new Date(form.observedAt).toISOString(),
      };

      const res = await api.createIncident(payload);
      setResult(res);
    } catch (err) {
      setError(err.message || "Failed to record incident report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">File incident report</h1>
          <p className="editorial-subtext">
            Submit observed waterlogging, broken water mains, or drainage blockages for municipal review and spatial recurrence analysis.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/reports" className="btn btn-secondary">
            View incident register
          </Link>
        </div>
      </div>

      {result ? (
        <div className="panel">
          <div className="panel-body">
            <div className="civic-callout success">
              <IconCheckCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Incident successfully registered in municipal ledger.</strong>
                <div style={{ marginTop: "0.25rem", fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>
                  Canonical ID: {result.incidentId}
                </div>
              </div>
            </div>

            {result.duplicateHint?.suspectedDuplicate && (
              <div className="civic-callout warning">
                <IconAlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong>Historical spatial recurrence detected:</strong> Our proximity analysis identified {result.duplicateHint.candidates?.length} nearby historical record(s).
                  <p style={{ marginTop: "0.25rem", fontSize: "0.78rem" }}>
                    To uphold engineering data integrity, <em>JalLoop never automatically merges citizen reports</em>. Both records are maintained independently as candidate evidence for field inspection.
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <Link to={`/incidents/${result.incidentId}`} className="btn btn-primary">
                Open incident dossier <IconArrowRight size={13} />
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setResult(null);
                  setForm((p) => ({ ...p, description: "", locationLabel: "" }));
                }}
              >
                File another report
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="panel">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Field observation details</h2>
              <span className="panel-sub">Required fields marked with an asterisk (*)</span>
            </div>
          </div>

          <div className="panel-body">
            {error && (
              <div className="civic-callout danger">
                <strong>Submission error:</strong> {error}
              </div>
            )}

            <div className="form-section">
              <div className="form-grid-2">
                <div>
                  <label className="field-label">Category *</label>
                  <select name="category" value={form.category} onChange={handleChange} className="select-input">
                    <option value="WATERLOGGING">Waterlogging / Street inundation</option>
                    <option value="PIPE_LEAK">Drinking water pipe leak</option>
                    <option value="BLOCKED_DRAIN">Blocked stormwater drain</option>
                    <option value="WATER_SHORTAGE">Severe water supply deficit</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Priority severity *</label>
                  <select name="severity" value={form.severity} onChange={handleChange} className="select-input">
                    <option value="LOW">Low (Minor puddle / slight seepage)</option>
                    <option value="MODERATE">Moderate (Traffic slowed / continuous leak)</option>
                    <option value="HIGH">High (Deep waterlogging / gushing pipe)</option>
                    <option value="CRITICAL">Critical (Submerged underpass / main trunk burst)</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="field-label">Physical setting *</label>
                  <select name="locationType" value={form.locationType} onChange={handleChange} className="select-input">
                    <option value="ROAD">Roadway / Highway / Underpass</option>
                    <option value="OPEN_DRAIN">Open stormwater channel / Nallah</option>
                    <option value="RESIDENTIAL_PROPERTY">Residential lane</option>
                    <option value="COMMERCIAL_AREA">Commercial market / Chowk</option>
                    <option value="PARK_OR_OPEN_GROUND">Public park / Open ground</option>
                    <option value="WATER_BODY_BUFFER">Lake / River buffer margin</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Observed timestamp *</label>
                  <input
                    type="datetime-local"
                    name="observedAt"
                    value={form.observedAt}
                    onChange={handleChange}
                    className="text-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Landmark or street address</label>
                <input
                  type="text"
                  name="locationLabel"
                  value={form.locationLabel}
                  onChange={handleChange}
                  placeholder="e.g. FC Road underpass near Goodluck Chowk"
                  className="text-input"
                />
                <span className="field-hint">Provide recognizable local intersections or municipal ward references.</span>
              </div>

              <div>
                <label className="field-label">Map location (Click map to position coordinates) *</label>
                <div className="map-worksurface" style={{ marginBottom: "0.5rem" }}>
                  <MapContainer center={coords} zoom={13} scrollWheelZoom={false} className="map-compact">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationPickerMarker position={coords} setPosition={setCoords} />
                  </MapContainer>
                </div>

                <div className="form-grid-2">
                  <div>
                    <label className="field-label" style={{ fontSize: "0.72rem" }}>Latitude</label>
                    <input
                      type="number"
                      step="0.0000001"
                      value={coords[0]}
                      onChange={(e) => setCoords([parseFloat(e.target.value) || 0, coords[1]])}
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
                      value={coords[1]}
                      onChange={(e) => setCoords([coords[0], parseFloat(e.target.value) || 0])}
                      className="text-input"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label">Observations & civic impact *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe standing water depth, flow direction, duration of overflow, or impact on pedestrian and vehicle traffic..."
                  className="textarea-input"
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
                <Link to="/reports" className="btn btn-secondary">
                  Cancel
                </Link>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Registering report..." : "Submit incident record"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
