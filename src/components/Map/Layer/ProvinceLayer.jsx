import { GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";
import provinceApi from "../../../api/provinceApi";
import { useNavigate } from "react-router-dom";

export default function ProvinceLayer() {
  const [provinces, setProvinces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    provinceApi.getAll().then(setProvinces).catch(console.error);
  }, []);

  const onEachProvince = (feature, layer) => {
    layer.on({
      click: () => navigate(`/province/${feature.properties.id}`),
    });
    layer.bindTooltip(feature.properties.name);
  };

  return (
    <>
      {provinces.length > 0 && (
        <GeoJSON
          data={provinces}
          onEachFeature={onEachProvince}
          style={() => ({
            color: "#555",
            weight: 1,
            fillColor: "#2a9d8f",
            fillOpacity: 0.3,
          })}
        />
      )}
    </>
  );
}
