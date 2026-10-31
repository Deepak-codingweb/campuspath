const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Local development has a convenient default. Production must use the public
// backend URL configured in the hosting dashboard (VITE_API_BASE_URL).
export const API_BASE_URL = (configuredApiUrl || (import.meta.env.DEV ? "http://127.0.0.1:5000" : "")).replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiRequest(path, options = {}) {
  if (!API_BASE_URL && !import.meta.env.DEV) {
    const error = new Error("The public API URL is not configured. Set VITE_API_BASE_URL in your hosting dashboard.");
    error.code = "MISSING_API_URL";
    throw error;
  }

  let response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    const error = new Error(
      API_BASE_URL
        ? "The CampusPath API could not be reached. It may be starting up; try again shortly."
        : "The public API URL is not configured. Set VITE_API_BASE_URL in your hosting dashboard."
    );
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed (${response.status}).`);
  }
  return data;
}
