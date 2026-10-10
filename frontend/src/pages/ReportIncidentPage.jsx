import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { api } from "../services/api.js";
import { createCategoryIcon } from "../utils/leafletIcons.js";

// Helper component to update coordinates when clicking on the map
function LocationPickerMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} icon={createCategoryIcon("WATERLOGGING", "HIGH")} /> : null;
}

export default function ReportIncidentPage() {
  const navigate = useNavigate();
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
      setError("Please describe the incident observed.");
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
      setError(err.message || "Failed to submit incident report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className="page-header">
        <div>
          <h2>Report a Water or Drainage Incident</h2>
          <p>
            Help municipal engineers locate waterlogging, broken distribution pipes, and blocked stormwater channels.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/map" className="btn btn-secondary">
            View Live Map
          </Link>
        </div>
      </div>

      {result ? (
        <div className="card">
          <div className="alert alert-success">
            <div>
              <h4 style={{ marginBottom: "0.25rem" }}>Report Successfully Registered!</h4>
              <p>Your civic incident reference has been saved with canonical ID:</p>
              <code style={{ fontSize: "0.85rem", background: "white", padding: "0.2rem 0.4rem", borderRadius: "4px" }}>
                {result.incidentId}
              </code>
            </div>
          </div>

          {result.duplicateHint?.suspectedDuplicate && (
            <div className="alert alert-warning">
              <div>
                <strong>Recurring Spatial Candidate Detected:</strong> Our heuristic analysis detected {result.duplicateHint.candidates?.length} nearby historical record(s) within radius.
                <p style={{ marginTop: "0.25rem", fontSize: "0.85rem" }}>
                  To maintain data integrity, <em>JalLoop never auto-merges citizen records</em>. Both incidents remain preserved as independent evidence for inspector verification.
                </p>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <Link to={`/incidents/${result.incidentId}`} className="btn btn-primary">
              View Incident Details & Tracking &rarr;
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setResult(null);
                setForm((prev) => ({ ...prev, description: "", locationLabel: "" }));
              }}
            >
              Report Another Incident
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="grid-2">
            <div className="form-group">
              <label>Incident Category *</label>
              <select name="category" value={form.category} onChange={handleChange} className="form-control">
                <option value="WATERLOGGING">Waterlogging / Street Flooding</option>
                <option value="PIPE_LEAK">Drinking Water Pipe Leak</option>
                <option value="BLOCKED_DRAIN">Blocked Stormwater Drain</option>
                <option value="WATER_SHORTAGE">Severe Water Supply Deficit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Severity Level *</label>
              <select name="severity" value={form.severity} onChange={handleChange} className="form-control">
                <option value="LOW">Low (Minor puddle / slight seep)</option>
                <option value="MODERATE">Moderate (Traffic slowed / noticeable loss)</option>
                <option value="HIGH">High (Deep waterlogging / gushing pipe)</option>
                <option value="CRITICAL">Critical (Submerged underpass / complete main burst)</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Location Setting *</label>
              <select name="locationType" value={form.locationType} onChange={handleChange} className="form-control">
                <option value="ROAD">Road / Highway / Underpass</option>
                <option value="OPEN_DRAIN">Open Stormwater Nallah / Drain</option>
                <option value="RESIDENTIAL_PROPERTY">Residential Colony Lane</option>
                <option value="COMMERCIAL_AREA">Commercial Market / Chowk</option>
                <option value="PARK_OR_OPEN_GROUND">Public Park / Open Ground</option>
                <option value="WATER_BODY_BUFFER">Lake / River Buffer Margin</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date & Time Observed *</label>
              <input
                type="datetime-local"
                name="observedAt"
                value={form.observedAt}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location Landmark / Address</label>
            <input
              type="text"
              name="locationLabel"
              value={form.locationLabel}
              onChange={handleChange}
              placeholder="e.g. FC Road near Goodluck Chowk, Deccan Gymkhana"
              className="form-control"
            />
            <span className="form-help">Enter a recognizable street name, intersection, or landmark.</span>
          </div>

          <div className="form-group">
            <label>Pinpoint Location on Map (Click anywhere on the map to set GPS coordinates) *</label>
            <div className="map-wrapper" style={{ marginBottom: "0.5rem" }}>
              <MapContainer
                center={coords}
                zoom={13}
                scrollWheelZoom={false}
                className="map-container-sm"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerMarker position={coords} setPosition={setCoords} />
              </MapContainer>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label style={{ fontSize: "0.75rem" }}>Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={coords[0]}
                  onChange={(e) => setCoords([parseFloat(e.target.value) || 0, coords[1]])}
                  className="form-control"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: "0.75rem" }}>Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  value={coords[1]}
                  onChange={(e) => setCoords([coords[0], parseFloat(e.target.value) || 0])}
                  className="form-control"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Detailed Observations & Civic Impact *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the depth of standing water, duration of overflow, approximate flow rate, or impact on pedestrian/vehicular movement..."
              className="form-control"
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
            <Link to="/map" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Registering Report..." : "Submit Incident Report"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
