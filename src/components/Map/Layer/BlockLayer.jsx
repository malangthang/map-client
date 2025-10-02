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
    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    try {
      const data = await blockApi.getByProvince(provinceId, bbox, zoom, 2000);
      setBlocks(data);
    } catch (err) {
      console.error("❌ Lỗi load blocks:", err);
    }
  };

  useEffect(() => {
    loadBlocks();
    map.on("moveend", loadBlocks);
    map.on("zoomend", loadBlocks);

    return () => {
      map.off("moveend", loadBlocks);
      map.off("zoomend", loadBlocks);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceId, map]);

  const blockStyle = (feature) => ({
    color: hoveredId === feature.properties?.id ? "#d62828" : "#264653",
    weight: 1,
    fillColor: hoveredId === feature.properties?.id ? "#f77f00" : "#2a9d8f",
    fillOpacity: 0.1,
  });

  const onEachBlock = (feature, layer) => {
    const id = feature.properties?.id;
    layer.on({
      mouseover: () => setHoveredId(id),
      mouseout: () => setHoveredId(null),
      click: () => {
        if (id && onBlockClick) onBlockClick(id); // ✅ gọi callback, không navigate
      },
    });
  };

  if (!blocks) return null;

  return (
    <GeoJSON
      data={blocks}
      style={blockStyle}
      onEachFeature={onEachBlock}
      renderer={L.canvas()} // Bắt buộc dùng Canvas cho hiệu năng
    />
  );
}
