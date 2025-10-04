// BlockLayer.jsx
import { useEffect, useState } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import blockApi from "../../../api/blockApi";

export default function BlockLayer({
  provinceId,
  selectedBlocks,
  setSelectedBlocks,
}) {
  const [blocks, setBlocks] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const map = useMap();

  // Load block theo bbox + zoom
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
    loadBlocks();

    map.on("moveend", loadBlocks);
    map.on("zoomend", () => {
      const z = map.getZoom();
      if (z > 12) {
        map.setMinZoom(z);
        map.setMaxZoom(z);
      } else {
        map.setMinZoom(1);
        map.setMaxZoom(16);
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
    const isSelected = (selectedBlocks || []).some(
      (b) => b.properties.id === id
    );

    return {
      color: hoveredId === id ? "#d62828" : isSelected ? "#1d3557" : "#264653",
      weight: isSelected ? 2 : 1,
      fillColor: isSelected
        ? "#e9c46a"
        : hoveredId === id
        ? "#f77f00"
        : "#2a9d8f",
      fillOpacity: isSelected ? 0.5 : 0.1,
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
        if (zoom > 12) {
          // ✅ Toggle chọn/deselect block
          setSelectedBlocks((prev) => {
            const exists = prev.some((b) => b.properties.id === id);
            if (exists) {
              return prev.filter((b) => b.properties.id !== id);
            } else {
              return [...prev, feature];
            }
          });
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
      renderer={L.canvas()}
    />
  );
}
