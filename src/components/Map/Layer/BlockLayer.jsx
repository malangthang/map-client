import { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import blockApi from "../../../api/blockApi";

export default function BlockLayer({ provinceId, onBlockClick }) {
  const [blocks, setBlocks] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const map = useMap();

  // Hàm load block theo bbox + zoom
  const loadBlocks = async () => {
    if (!map) return;
    try {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      const bbox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];

      const data = await blockApi.getByProvince(provinceId, bbox, zoom, 2000);
      setBlocks(data);
    } catch (err) {
      console.error("❌ Lỗi load blocks:", err);
    }
  };

  useEffect(() => {
    if (!map) return;

    // Load lần đầu
    loadBlocks();

    // Lắng nghe move và zoom
    map.on("moveend", loadBlocks);
    map.on("zoomend", () => {
      const z = map.getZoom();
      if (z > 12) {
        // Khóa zoom tại mức hiện tại
        map.setMinZoom(z);
        map.setMaxZoom(z);
      } else {
        // Trả lại range zoom bình thường
        map.setMinZoom(1);
        map.setMaxZoom(22);
      }
      loadBlocks();
    });

    return () => {
      map.off("moveend", loadBlocks);
      map.off("zoomend");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, map]);

  // Style cho block
  const blockStyle = (feature) => {
    const id = feature.properties?.id;
    return {
      color: hoveredId === id ? "#d62828" : "#264653",
      weight: 1,
      fillColor: hoveredId === id ? "#f77f00" : "#2a9d8f",
      fillOpacity: 0.15,
    };
  };

  // Event cho block
  const onEachBlock = (feature, layer) => {
    const id = feature.properties?.id;
    layer.on({
      mouseover: () => setHoveredId(id),
      mouseout: () => setHoveredId(null),
      click: () => {
        const zoom = map.getZoom();
        if (zoom > 12 && onBlockClick) {
          onBlockClick(feature); // ✅ chỉ cho chọn khi zoom > 12
        }
      },
    });
  };

  if (!blocks) return null;

  return (
    <GeoJSON
      data={blocks}
      style={blockStyle}
      onEachFeature={onEachBlock}
      renderer={L.canvas()} // Canvas cho hiệu năng cao
    />
  );
}
