const LOCAL_HOST_PATTERN =
  /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/;

const hostname = typeof window !== "undefined" ? window.location.hostname : "";
const localApiOrigin = LOCAL_HOST_PATTERN.test(hostname)
  ? `http://${hostname === "localhost" ? "127.0.0.1" : hostname}:5001`
  : "https://medical-ai-assit.onrender.com";
const configuredApiOrigin = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");

export const API_URL = configuredApiOrigin || localApiOrigin;
export const API_BASE_URL = `${API_URL}/api`;
