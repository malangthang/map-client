import { useMap } from "react-leaflet";
import { useEffect, useState } from "react";

export default function useZoomLevel() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const updateZoom = () => setZoom(map.getZoom());
    map.on("zoomend", updateZoom);
    return () => map.off("zoomend", updateZoom);
  }, [map]);

  return zoom;
}
