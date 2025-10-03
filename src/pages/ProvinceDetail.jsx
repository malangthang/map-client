import { useParams } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import { useEffect, useState } from "react";
import BlockLayer from "../components/Map/Layer/BlockLayer";
import FitBounds from "../components/Map/FitBounds";
import blockApi from "../api/blockApi";

export default function ProvinceDetail() {
  const { slug } = useParams();
  const [blocksGeoJSON, setBlocksGeoJSON] = useState(null);

  // Load blocks 1 lần để FitBounds khi mở province
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await blockApi.getByProvince(slug);

        if (res.type === "FeatureCollection") {
          setBlocksGeoJSON(res);
        } else if (Array.isArray(res)) {
          setBlocksGeoJSON({
            type: "FeatureCollection",
            features: res,
          });
        } else {
          console.error("❌ Dữ liệu blocks không hợp lệ:", res);
        }
      } catch (err) {
        console.error("❌ Lỗi load blocks:", err);
      }
    };
    loadBlocks();
  }, [slug]);

  return (
    <MapContainer
      style={{ height: "100vh", width: "100%" }}
      zoom={10}
      center={[16, 108]}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {/* ✅ Hiển thị blocks (cha) */}
      {blocksGeoJSON && <BlockLayer provinceId={slug} />}

      {/* ✅ Fit map lần đầu theo blocks */}
      {blocksGeoJSON && <FitBounds geojson={blocksGeoJSON} />}
    </MapContainer>
  );
}
