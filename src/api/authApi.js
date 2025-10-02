import { API_BASE } from "../config";

const authApi = {
  register: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to register");
      return await res.json();
    } catch (err) {
      console.error("❌ authApi.register error:", err);
      return null;
    }
  },

  login: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to login");
      return await res.json();
    } catch (err) {
      console.error("❌ authApi.login error:", err);
      return null;
    }
  },

  profile: async (token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return await res.json();
    } catch (err) {
      console.error("❌ authApi.profile error:", err);
      return null;
    }
  },
};

export default authApi;
