import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { api } from "../services/api.js";
import { createCategoryIcon, createHotspotIcon } from "../utils/leafletIcons.js";

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

  // Center map around Pune default
  const defaultCenter = [18.5204, 73.8567];

  useEffect(() => {
    loadData();
  }, [category, status, severity]);

  async function loadData() {
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

      setIncidents(incidentsData.items || []);
      setHotspots(hotspotsData || []);
    } catch (err) {
      setError(err.message || "Failed to load map data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Interactive Civic Incident Map</h2>
          <p>
            Explore real-time waterlogging, pipe leaks, and recurring failure hotspots across municipal wards.
          </p>
        </div>
        <div className="header-actions">
          <Link to="/report" className="btn btn-primary">
            + Report New Incident
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-item">
          <label>Category:</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-control" style={{ width: "auto" }}>
            <option value="">All Categories</option>
            <option value="WATERLOGGING">Waterlogging</option>
            <option value="PIPE_LEAK">Pipe Leak</option>
            <option value="BLOCKED_DRAIN">Blocked Drain</option>
            <option value="WATER_SHORTAGE">Water Shortage</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="form-control" style={{ width: "auto" }}>
            <option value="">All Statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Severity:</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="form-control" style={{ width: "auto" }}>
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div className="filter-item" style={{ marginLeft: "auto" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
            />
            Show Hotspot Clusters
          </label>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="detail-grid">
        {/* Map View */}
        <div className="map-wrapper">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            className="map-container"
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
              >
                <Popup>
                  <div style={{ minWidth: "200px" }}>
                    <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                      <span className={`badge badge-${inc.category?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.category?.replace("_", " ")}
                      </span>
                      <span className={`badge badge-${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.status?.replace("_", " ")}
                      </span>
                      {inc.syntheticDemo && <span className="badge badge-synthetic">DEMO</span>}
                    </div>

                    <h4 style={{ fontSize: "0.95rem", margin: "0.25rem 0" }}>
                      {inc.locationLabel || "Incident Location"}
                    </h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--gray-600)", margin: "0.3rem 0 0.6rem 0" }}>
                      {inc.summary?.slice(0, 100)}...
                    </p>

                    <Link to={`/incidents/${inc.id}`} className="btn btn-primary btn-sm" style={{ width: "100%", textAlign: "center" }}>
                      View Full Details &rarr;
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
                      <span className="badge badge-high" style={{ marginBottom: "0.4rem" }}>
                        HOTSPOT CLUSTER
                      </span>
                      <h4 style={{ margin: "0.3rem 0" }}>
                        {hot.incidentCount} Recurring Incidents
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "var(--gray-600)" }}>
                        Dominant Category: <strong>{hot.dominantCategory}</strong><br />
                        Unresolved: <strong>{hot.unresolvedCount}</strong><br />
                        Heuristic Score: <strong>{hot.heuristicScore}</strong> ({hot.heuristicLabel})
                      </p>
                      {hot.syntheticDemo && (
                        <p style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontStyle: "italic", marginTop: "0.3rem" }}>
                          Demonstration cluster.
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>

        {/* Sidebar List of Filtered Incidents */}
        <div className="card" style={{ height: "580px", display: "flex", flexDirection: "column", padding: "1.25rem" }}>
          <div className="card-header" style={{ marginBottom: "0.75rem" }}>
            <div>
              <h3>Visible Incidents ({incidents.length})</h3>
              <p>Click any record to inspect</p>
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.25rem" }}>
            {incidents.length === 0 ? (
              <div className="empty-state">
                <p>No incidents match the active filter criteria.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      border: "1px solid var(--gray-200)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.75rem",
                      background: "var(--gray-50)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                      <span className={`badge badge-${inc.category?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.category?.replace("_", " ")}
                      </span>
                      <span className={`badge badge-${inc.status?.toLowerCase()?.replace("_", "-")}`}>
                        {inc.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--gray-900)" }}>
                      {inc.locationLabel || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--gray-600)", margin: "0.3rem 0" }}>
                      {inc.summary?.slice(0, 80)}...
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--gray-500)" }}>
                        {inc.firstObservedAt ? new Date(inc.firstObservedAt).toLocaleDateString() : ""}
                      </span>
                      <Link to={`/incidents/${inc.id}`} className="btn btn-secondary btn-sm" style={{ padding: "0.2rem 0.5rem" }}>
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
