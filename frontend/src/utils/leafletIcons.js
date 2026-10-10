import L from "leaflet";

// Create clean, responsive SVG pin icons for Leaflet
export function createCategoryIcon(category = "WATERLOGGING", severity = "MODERATE") {
  let color = "#0284c7"; // blue default
  if (category === "WATERLOGGING") color = "#0284c7";
  else if (category === "PIPE_LEAK") color = "#2563eb";
  else if (category === "BLOCKED_DRAIN") color = "#d97706";
  else if (category === "WATER_SHORTAGE") color = "#dc2626";

  let stroke = "#ffffff";
  if (severity === "CRITICAL") stroke = "#ef4444";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="28" height="36">
      <path fill="${color}" stroke="${stroke}" stroke-width="1.5" d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z"/>
      <circle cx="12" cy="11" r="4.5" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: "custom-leaflet-pin",
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  });
}

export function createHotspotIcon(dominantCategory, count) {
  let color = "#d97706";
  if (dominantCategory === "WATERLOGGING") color = "#0284c7";
  if (dominantCategory === "WATER_SHORTAGE") color = "#dc2626";

  const html = `
    <div style="
      background-color: ${color};
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 13px;
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    ">
      ${count}
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-hotspot",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}
