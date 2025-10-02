import { API_BASE } from "../config";

const provinceApi = {
  // Lấy danh sách tỉnh (id, name, center, price,…)
  getAll: async () => {
    try {
      const res = await fetch(`${API_BASE}/provinces`);
      if (!res.ok) throw new Error("Failed to fetch provinces");
      return await res.json();
    } catch (err) {
      console.error("❌ provinceApi.getAll error:", err);
      return [];
    }
  },

  // Lấy shape của 1 tỉnh theo ID
  getById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/provinces/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch province by id: ${id}`);
      return await res.json();
    } catch (err) {
      console.error("❌ provinceApi.getById error:", err);
      return null;
    }
  },

  // Lấy shape của 1 tỉnh theo slug
  getBySlug: async (slug) => {
    try {
      const res = await fetch(`${API_BASE}/provinces/${slug}`);
      if (!res.ok) throw new Error(`Failed to fetch province by slug: ${slug}`);
      return await res.json();
    } catch (err) {
      console.error("❌ provinceApi.getBySlug error:", err);
      return null;
    }
  },
};

export default provinceApi;
