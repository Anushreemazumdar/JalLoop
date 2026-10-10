import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../services/api.js";
import { createCategoryIcon, createHotspotIcon } from "../utils/leafletIcons.js";
import {
  IconPlus,
  IconFilter,
  IconArrowRight,
  IconMapPin,
  IconRefresh,
} from "../components/Icons.jsx";

export default function MapPage() {
  const [incidents, setIncidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [showHotspots, setShowHotspots] = useState(true);

  // Selected incident for the side working inspector
  const [selectedIncident, setSelectedIncident] = useState(null);

  const defaultCenter = [18.5204, 73.8567]; // Pune urban center

  useEffect(() => {
    loadMapData();
  }, [category, status, severity]);

  async function loadMapData() {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (category) params.category = category;
      if (status) params.status = status;
      if (severity) params.severity = severity;

      const [incidentsData, hotspotsData] = await Promise.all([
        api.incidents(params),
        api.hotspots(),
      ]);

      const items = incidentsData.items || [];
      setIncidents(items);
      setHotspots(hotspotsData || []);

      if (items.length > 0 && !selectedIncident) {
        setSelectedIncident(items[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load spatial map records");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="editorial-header">
        <div>
          <h1 className="editorial-title">Spatial incident map</h1>
          <p className="editorial-subtext">
            Operational mapping of waterlogging, infrastructure leaks, blocked channels, and recurring spatial clusters.
          </p>
        </div>
        <div className="header-action-row">
          <Link to="/report" className="btn btn-primary">
            <IconPlus size={14} /> Report incident
          </Link>
          <button className="btn btn-secondary" onClick={loadMapData} title="Refresh records">
            <IconRefresh size={13} />
          </button>
        </div>
      </div>

      {/* Filter Tray */}
      <div className="map-filter-tray">
        <div className="map-filter-group">
          <IconFilter size={13} style={{ color: "var(--ink-muted)" }} />
          <label>Category:</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All categories</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="PIPE_LEAK">Pipe leak</option>
            <option value="BLOCKED_DRAIN">Blocked drain</option>
            <option value="WATER_SHORTAGE">Water shortage</option>
          </select>
        </div>

        <div className="map-filter-group">
          <label>Status:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="UNDER_REVIEW">Under review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VERIFIED">Verified</option>
          </select>
        </div>

        <div className="map-filter-group">
          <label>Priority:</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="select-input"
            style={{ width: "auto", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
          >
            <option value="">All priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MODERATE">Moderate</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="map-filter-group" style={{ marginLeft: "auto" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", color: "var(--ink-primary)" }}>
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
            />
            Show recurrence clusters ({hotspots.length})
          </label>
        </div>
      </div>

      {error && (
        <div className="civic-callout danger">
          <strong>Map error:</strong> {error}
        </div>
      )}

      {/* Main Working Layout: Map Worksurface + Inspector Side Drawer */}
      <div className="split-layout-65-35">
        {/* Working Map Surface */}
        <div className="map-worksurface">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="map-tall"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Incident Markers */}
            {incidents.map((inc) => (
              <Marker
                key={inc.id}
                position={[parseFloat(inc.latitude), parseFloat(inc.longitude)]}
                icon={createCategoryIcon(inc.category, inc.severity)}
                eventHandlers={{
                  click: () => setSelectedIncident(inc),
                }}
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span className="category-tag">{inc.category?.replace("_", " ")}</span>
                      <span className={`status-pill ${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.status}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", margin: "0.2rem 0" }}>
                      {inc.locationLabel || "Incident location"}
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "var(--ink-secondary)", margin: "0.3rem 0 0.5rem" }}>
                      {inc.summary?.slice(0, 90)}...
                    </p>
                    <Link to={`/incidents/${inc.id}`} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
                      Open dossier
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Hotspot Cluster Markers */}
            {showHotspots &&
              hotspots.map((hot) => (
                <Marker
                  key={hot.id}
                  position={[parseFloat(hot.latitude), parseFloat(hot.longitude)]}
                  icon={createHotspotIcon(hot.dominantCategory, hot.incidentCount)}
                >
                  <Popup>
                    <div>
                      <div className="tag-notice" style={{ marginBottom: "0.3rem", width: "fit-content" }}>
                        RECURRING HOTSPOT
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {hot.incidentCount} Historical failures
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "var(--ink-secondary)", margin: "0.3rem 0" }}>
                        Dominant type: <strong>{hot.dominantCategory?.replace("_", " ")}</strong><br />
                        Unresolved: <strong>{hot.unresolvedCount}</strong><br />
                        Heuristic score: <strong>{hot.heuristicScore}</strong> ({hot.heuristicLabel})
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          {/* Understated Map Legend Strip */}
          <div className="map-legend-strip">
            <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em", color: "var(--ink-muted)" }}>
              Legend:
            </span>
            <div className="legend-key">
              <span className="legend-dot" style={{ backgroundColor: "#24587a" }}></span>
              <span>Waterlogging</span>
            </div>
            <div className="legend-key">
              <span className="legend-dot" style={{ backgroundColor: "#2b7496" }}></span>
              <span>Pipe leak</span>
            </div>
            <div className="legend-key">
              <span className="legend-dot" style={{ backgroundColor: "#a15a03" }}></span>
              <span>Blocked drain</span>
            </div>
            <div className="legend-key">
              <span className="legend-dot" style={{ backgroundColor: "#a82020" }}></span>
              <span>Water shortage</span>
            </div>
            {showHotspots && (
              <div className="legend-key">
                <span className="legend-dot" style={{ backgroundColor: "#73808c", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "8px" }}>#</span>
                <span>Spatial cluster</span>
              </div>
            )}
          </div>
        </div>

        {/* Working Incident Inspector Side Panel */}
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-header">
            <div>
              <h2 className="panel-title">Inspection drawer</h2>
              <span className="panel-sub">Select any marker on the map to inspect</span>
            </div>
          </div>

          <div className="panel-body">
            {selectedIncident ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  <span className={`status-pill ${selectedIncident.status?.toLowerCase()?.replace("_", "-")}`}>
                    {selectedIncident.status?.replace("_", " ")}
                  </span>
                  <span className={`priority-flag ${selectedIncident.severity?.toLowerCase() || "moderate"}`}>
                    {selectedIncident.severity} PRIORITY
                  </span>
                  {selectedIncident.syntheticDemo && (
                    <span className="tag-notice">SYNTHETIC DEMO</span>
                  )}
                </div>

                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", fontWeight: 600, color: "var(--ink-primary)", marginBottom: "0.4rem" }}>
                  {selectedIncident.locationLabel || "Unlabelled location"}
                </h3>

                <p style={{ fontSize: "0.84rem", color: "var(--ink-secondary)", lineHeight: 1.5, marginBottom: "1rem" }}>
                  {selectedIncident.summary}
                </p>

                <div className="dossier-meta-grid">
                  <div className="dossier-meta-item">
                    <label>Setting</label>
                    <span>{selectedIncident.locationType?.replace("_", " ")}</span>
                  </div>
                  <div className="dossier-meta-item">
                    <label>Reported date</label>
                    <span>
                      {selectedIncident.firstObservedAt ? new Date(selectedIncident.firstObservedAt).toLocaleDateString() : "Recent"}
                    </span>
                  </div>
                  <div className="dossier-meta-item">
                    <label>Coordinates</label>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>
                      {parseFloat(selectedIncident.latitude).toFixed(4)}, {parseFloat(selectedIncident.longitude).toFixed(4)}
                    </span>
                  </div>
                  <div className="dossier-meta-item">
                    <label>Recurrence</label>
                    <span>{selectedIncident.suspectedDuplicate ? "Candidate repeat" : "First record"}</span>
                  </div>
                </div>

                {selectedIncident.recommendedNextAction && (
                  <div style={{ background: "var(--bg-subtle)", padding: "0.75rem", borderLeft: "3px solid var(--water-primary)", borderRadius: "var(--radius-xs)", marginBottom: "1.25rem" }}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", color: "var(--water-primary)", letterSpacing: "0.04em" }}>
                      Advisory next action
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--ink-primary)", marginTop: "0.2rem" }}>
                      {selectedIncident.recommendedNextAction}
                    </div>
                  </div>
                )}

                <Link
                  to={`/incidents/${selectedIncident.id}`}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  Open complete dossier & verification <IconArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div style={{ color: "var(--ink-muted)", fontSize: "0.85rem", textAlign: "center", padding: "2rem 0" }}>
                Click any marker on the map to inspect its field findings and historical records.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
