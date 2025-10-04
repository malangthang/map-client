import axios from "axios";
import { API_BASE } from "../config";

const orderApi = {
  // Tạo order và claim block(s)
  create: async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (!res.ok) throw new Error(data.message || "Failed to create order");
        return data;
      } catch {
        throw new Error(`Server trả về không phải JSON: ${text.slice(0, 100)}...`);
      }
    } catch (err) {
      console.error("❌ orderApi.create error:", err);
      return null;
    }
  },

  // Upload ảnh block
  uploadImage: async (formData) => {
    try {
      const res = await axios.post(`${API_BASE}/orders/upload-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data; // { path: 'storage/blocks/abc.png' }
    } catch (err) {
      console.error("❌ orderApi.uploadImage error:", err.response?.data || err);
      throw err;
    }
  },
};

export default orderApi;
