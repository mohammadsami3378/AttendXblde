import axios from "axios";

// ✅ Use Render backend URL from env
const API_URL = import.meta.env.VITE_API_URL;

// ❗ Safety fallback (prevents crash in production)
if (!API_URL) {
  console.warn("⚠️ VITE_API_URL not set, using fallback");
}

// ✅ Create axios instance
const api = axios.create({
  baseURL: `${API_URL || "http://localhost:5000"}/api`,
  withCredentials: true,
});

// ✅ Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Global response error handler (VERY USEFUL)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error?.response || error.message);

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;