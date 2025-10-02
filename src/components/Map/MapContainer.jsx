import { MapContainer, GeoJSON, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import * as turf from "@turf/turf";
import FitBounds from "./FitBounds";
import provinceApi from "../../api/provinceApi";

export default function VietnamMap() {
  const [data, setData] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate(); // 🟢 hook điều hướng

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoading(true);
        const json = await provinceApi.getAll();
        setData(json);
      } catch (err) {
        setError("Không thể tải dữ liệu tỉnh, vui lòng thử lại!");
      } finally {
        setLoading(false);
      }
    };
    loadProvinces();
  }, []);

  const geoStyle = (feature) => ({
    fillColor:
      hoveredId === feature.properties?.id
        ? "rgba(255, 193, 7, 0.6)"
        : "rgba(0, 123, 255, 0.4)",
    color: hoveredId === feature.properties?.id ? "#d39e00" : "#004085",
    weight: 1,
  });

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: () => setHoveredId(feature.properties?.id),
      mouseout: () => setHoveredId(null),
      click: () => {
        const slug = feature.properties?.slug;
        if (slug) {
          navigate(`/province/${slug}`);
        }
      },
    });
  };

  const renderProvinceLabel = (feature) => {
    if (!feature.geometry || feature.properties?.id !== hoveredId) return null;

    const centroid = turf.centroid(feature);
    const [lng, lat] = centroid.geometry.coordinates;

    const provinceName = (feature.properties?.name || "No name")
      .replace(/(\r\n|\n|\r)/gm, " ")
      .replace(/\s+/g, " ")
      .trim();

    return (
      <Marker
        key={feature.properties?.id}
        position={[lat, lng]}
        icon={L.divIcon({
          className: "province-label",
          html: `<div class="province-label-text">${provinceName}</div>`,
          iconAnchor: [0, 0],
        })}
        interactive={false}
      />
    );
  };

  if (loading) {
    return <div style={{ padding: "20px" }}>⏳ Đang tải bản đồ...</div>;
  }

  if (error) {
    return <div style={{ color: "red", padding: "20px" }}>{error}</div>;
  }

  return (
    <MapContainer
      style={{ height: "100vh", width: "100%" }}
      zoom={6}
      center={[16, 108]}
    >
      {data && (
        <>
          <GeoJSON data={data} style={geoStyle} onEachFeature={onEachFeature} />
          <FitBounds geojson={data} />
          {data.features.map((f) => renderProvinceLabel(f))}
        </>
      )}
    </MapContainer>
  );
}
