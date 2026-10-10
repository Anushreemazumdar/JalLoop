import L from "leaflet";

const CATEGORY_COLORS = {
  WATERLOGGING: "#24587a",
  PIPE_LEAK: "#2b7496",
  BLOCKED_DRAIN: "#a15a03",
  WATER_SHORTAGE: "#a82020",
};

export function createCategoryIcon(category = "WATERLOGGING", severity = "MODERATE") {
  const fill = CATEGORY_COLORS[category] || "#24587a";
  const stroke = severity === "CRITICAL" ? "#a82020" : "#ffffff";
  const strokeWidth = severity === "CRITICAL" ? "2.5" : "1.5";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="26" height="34">
      <path fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" d="M12 0C5.37 0 0 5.37 0 12c0 8.5 12 20 12 20s12-11.5 12-20c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="11" r="4" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "civic-map-marker",
    iconSize: [26, 34],
    iconAnchor: [13, 34],
    popupAnchor: [0, -30],
  });
}

export function createHotspotIcon(dominantCategory, count) {
  const fill = CATEGORY_COLORS[dominantCategory] || "#73808c";

  const html = `
    <div style="
      background-color: ${fill};
      color: #ffffff;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'IBM Plex Mono', monospace;
      font-weight: 600;
      font-size: 11px;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    ">
      ${count}
    </div>
  `;

  return L.divIcon({
    html,
    className: "civic-hotspot-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}
