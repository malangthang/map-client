import { useEffect, useState, useRef } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import * as turf from "@turf/turf";
import L from "leaflet";
import subBlockApi from "../../../api/subBlockApi";

export default function SubBlockLayer({ blocks }) {
  const map = useMap();
  const [subBlocks, setSubBlocks] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef({});

  // ---- Load sub-blocks theo viewport ----
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;

    const loadSubBlocksInView = async () => {
      const zoom = map.getZoom();

      // Zoom nhỏ → ẩn subBlocks
      if (zoom < 17) {
        setSubBlocks([]);
        return;
      }

      const bounds = map.getBounds();
      const boundsPoly = turf.bboxPolygon([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);

      const features = Array.isArray(blocks)
        ? blocks
        : blocks.type === "FeatureCollection"
        ? blocks.features
        : [];

      // Lọc block cha trong viewport
      const inView = features.filter((block) => {
        if (!block.geometry) return false;
        const blockPoly = turf.feature(block.geometry);
        return turf.booleanIntersects(boundsPoly, blockPoly);
      });

      if (inView.length === 0) {
        setSubBlocks([]);
        return;
      }

      setLoading(true);

      // Load sub-blocks chưa có trong cache
      await Promise.all(
        inView.map(async (b) => {
          const bid = b.properties?.id;
          if (!bid) return;
          if (cacheRef.current[bid]) return; // đã cache

          try {
            const res = await subBlockApi.getByBlock(bid);
            cacheRef.current[bid] = res.features || [];
          } catch (err) {
            console.error("❌ Lỗi load sub-block:", bid, err);
            cacheRef.current[bid] = [];
          }
        })
      );

      setLoading(false);

      // Gom sub-blocks từ các block trong viewport
      const inViewIds = inView.map((b) => b.properties?.id).filter(Boolean);
      const allFeatures = inViewIds
        .map((bid) => cacheRef.current[bid] || [])
        .flat();

      setSubBlocks(allFeatures);
    };

    map.on("zoomend", loadSubBlocksInView);
    map.on("moveend", loadSubBlocksInView); // sync khi move
    loadSubBlocksInView(); // chạy lần đầu

    return () => {
      map.off("zoomend", loadSubBlocksInView);
      map.off("moveend", loadSubBlocksInView);
    };
  }, [map, blocks]);

  // ---- Lock move khi zoom ≥ 17 ----
  useEffect(() => {
    const handleZoom = () => {
      if (map.getZoom() >= 17) {
        map.dragging.disable();
      } else {
        map.dragging.enable();
      }
    };
    map.on("zoomend", handleZoom);
    handleZoom(); // chạy lần đầu
    return () => map.off("zoomend", handleZoom);
  }, [map]);

  // ---- Style + popup ----
  const subBlockStyle = (feature) => ({
    color: hoveredId === feature.properties?.id ? "#e63946" : "#457b9d",
    weight: 1,
    fillColor:
      feature.properties?.status === "available" ? "#a8dadc" : "#f1faee",
    fillOpacity: hoveredId === feature.properties?.id ? 0.5 : 0.1,
  });

  const onEachSubBlock = (feature, layer) => {
    const sid = feature.properties?.id;
    layer.on({
      mouseover: () => setHoveredId(sid),
      mouseout: () => setHoveredId(null),
      click: () => {
        layer
          .bindPopup(
            `<b>Sub-block ID:</b> ${sid}<br>
             <b>Status:</b> ${feature.properties?.status}<br>
             <b>i:</b> ${feature.properties?.i}, <b>j:</b> ${feature.properties?.j}`
          )
          .openPopup();
      },
    });
  };

  return (
    <>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "rgba(255,255,255,0.9)",
            padding: "6px 12px",
            borderRadius: "6px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            zIndex: 1000,
            fontSize: "14px",
          }}
        >
          ⏳ Loading sub-blocks...
        </div>
      )}

      {subBlocks.length > 0 && (
        <GeoJSON
          data={{ type: "FeatureCollection", features: subBlocks }}
          style={subBlockStyle}
          onEachFeature={onEachSubBlock}
          renderer={L.canvas()}
        />
      )}
    </>
  );
}
