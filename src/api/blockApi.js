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

  // Claim block(s)
  claim: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/blocks/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Nếu server trả về HTML thay vì JSON (lỗi 500/404)
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.message || "Failed to claim block(s)");
        return data;
      } catch {
        // text không phải JSON → lỗi server
        throw new Error(`Server trả về không phải JSON: ${text.slice(0, 100)}...`);
      }
    } catch (err) {
      console.error("❌ blockApi.claim error:", err);
      return null;
    }
  },

  // Upload ảnh (multipart/form-data) dùng axios
  uploadImage: async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/blocks/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; // { path: 'storage/blocks/abc.png' }
    } catch (err) {
      console.error("❌ blockApi.uploadImage error:", err.response?.data || err);
      throw err;
    }
  },
};

export default blockApi;
