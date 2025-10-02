import { API_BASE } from "../config";

const subBlockApi = {
  getByBlock: async (blockId) => {
    const res = await fetch(`${API_BASE}/blocks/${blockId}/sub-blocks`);
    if (!res.ok) {
      throw new Error("Failed to fetch sub-blocks");
    }
    return await res.json();
  },
};


export default subBlockApi;
