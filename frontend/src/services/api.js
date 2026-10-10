const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

export function getActorKey() {
  return localStorage.getItem("jalloop.actor") || "demo-citizen";
}

export function setActorKey(key) {
  localStorage.setItem("jalloop.actor", key);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Actor-Key": getActorKey(),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || `Request failed (${response.status})`;
    const details = data?.details?.length ? ` ${data.details.join("; ")}` : "";
    const error = new Error(message + details);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const api = {
  health: () => request("/api/v1/health"),
  meta: () => request("/api/v1/meta"),
  summary: () => request("/api/v1/dashboard/summary"),
  hotspots: () => request("/api/v1/dashboard/hotspots"),
  recoveryOverview: () => request("/api/v1/dashboard/recovery"),
  incidents: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    const suffix = query.toString() ? `?${query}` : "";
    return request(`/api/v1/incidents${suffix}`);
  },
  incident: (id) => request(`/api/v1/incidents/${id}`),
  createIncident: (body) => request("/api/v1/incidents", { method: "POST", body: JSON.stringify(body) }),
  patchStatus: (id, body) => request(`/api/v1/incidents/${id}/status`, { method: "PATCH", body: JSON.stringify(body) }),
  assign: (id, body) => request(`/api/v1/incidents/${id}/assignments`, { method: "POST", body: JSON.stringify(body) }),
  inspect: (id, body) => request(`/api/v1/incidents/${id}/inspections`, { method: "POST", body: JSON.stringify(body) }),
  verify: (id, body) => request(`/api/v1/incidents/${id}/verifications`, { method: "POST", body: JSON.stringify(body) }),
  explain: (id) => request(`/api/v1/incidents/${id}/explain`, { method: "POST", body: JSON.stringify({}) }),
  shortages: (severity) => request(`/api/v1/water-shortages${severity ? `?severity=${severity}` : ""}`),
  createShortage: (body) => request("/api/v1/water-shortages", { method: "POST", body: JSON.stringify(body) }),
  catchments: () => request("/api/v1/catchments"),
  createCatchment: (body) => request("/api/v1/catchments", { method: "POST", body: JSON.stringify(body) }),
  createRainfall: (body) => request("/api/v1/rainfall-observations", { method: "POST", body: JSON.stringify(body) }),
  createAssessment: (body) => request("/api/v1/recovery-assessments", { method: "POST", body: JSON.stringify(body) }),
  assessments: () => request("/api/v1/recovery-assessments"),
  projects: () => request("/api/v1/recovery-projects"),
  createProject: (body) => request("/api/v1/recovery-projects", { method: "POST", body: JSON.stringify(body) }),
  reviewProject: (id, body) => request(`/api/v1/recovery-projects/${id}/review`, { method: "PATCH", body: JSON.stringify(body) }),
  measureProject: (id, body) => request(`/api/v1/recovery-projects/${id}/measurements`, { method: "POST", body: JSON.stringify(body) }),
};
