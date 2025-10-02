import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import provinceApi from "../../../api/provinceApi";
import FitBounds from "../FitBounds";

export default function ProvinceMap({ slug, title }) {
  const [provinceShape, setProvinceShape] = useState(null);

  useEffect(() => {
    const loadShape = async () => {
      try {
        const shape = await provinceApi.getBySlug(slug);

        // ✅ Nếu API trả về 1 Feature
        if (shape.type === "Feature") {
          setProvinceShape({
            type: "FeatureCollection",
            features: [shape],
          });
        }
        // ✅ Nếu API trả về FeatureCollection
        else if (shape.type === "FeatureCollection") {
          setProvinceShape(shape);
        }
        // ❌ Trường hợp khác thì log ra để check
        else {
          console.error("Dữ liệu không hợp lệ:", shape);
        }
      } catch (err) {
        console.error("❌ Lỗi load province shape:", err);
      }
    };
    loadShape();
  }, [slug]);

  const geoStyle = {
    color: "#2a9d8f",
    weight: 2,
    fillColor: "#e9c46a",
    fillOpacity: 0.4,
  };

  return (
    <div style={{ height: "300px", width: "300px", marginBottom: "20px" }}>
      <MapContainer
        style={{ height: "300px", width: "100%" }}
        zoom={6}
        center={[16, 108]}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {provinceShape && (
          <>
            <GeoJSON data={provinceShape} style={geoStyle} />
            <FitBounds geojson={provinceShape} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
