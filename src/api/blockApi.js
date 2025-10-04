import axios from "axios";
import { API_BASE } from "../config";

const blockApi = {
  // Lấy danh sách block trong 1 tỉnh
  getByProvince: async (provinceId, bbox, zoom, limit = 2000) => {
    try {
      const url = new URL(`${API_BASE}/blocks`);
      url.searchParams.append("province_id", provinceId);
      if (bbox) url.searchParams.append("bbox", bbox.join(","));
      if (zoom) url.searchParams.append("zoom", zoom);
      url.searchParams.append("limit", limit);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch blocks");
      return await res.json();
    } catch (err) {
      console.error("❌ blockApi.getByProvince error:", err);
      return [];
    }
  },

  // Lấy shape chi tiết của 1 block
  getShape: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/blocks/${id}/shape`);
      if (!res.ok) throw new Error("Failed to fetch block shape");
      return await res.json();
    } catch (err) {
      console.error("❌ blockApi.getShape error:", err);
      return null;
    }
  },
};

export default blockApi;
