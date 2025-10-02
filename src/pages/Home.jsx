import React from "react";
import VietnamMap from "../components/Map/MapContainer";
import ProvinceMap from "../components/Map/Layer/ProvinceMap";

export default function Home() {
  return (
    <div className="container-center">
      <div className="left-map">
        <VietnamMap />
      </div>
      <div className="center-province">
        <ProvinceMap slug="hanoi" title="Map Hà Nội" />
        <ProvinceMap slug="hochiminh" title="Map Hồ Chí Minh" />
      </div>
    </div>
  );
}
