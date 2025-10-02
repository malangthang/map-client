import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function FitBounds({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (geojson) {
      const layer = new L.GeoJSON(geojson);
      map.fitBounds(layer.getBounds());
    }
  }, [geojson, map]);

  return null;
}
