import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import BlockLayer from "../components/Map/Layer/BlockLayer";
import FitBounds from "../components/Map/FitBounds";
import blockApi from "../api/blockApi";
import { Modal, Input, Button, Form, message } from "antd";

// Component nhỏ để khóa zoom khi zoom > 12
function LockZoomOnHighLevel() {
  const map = useMap();
  useEffect(() => {
    const handleZoom = () => {
      const z = map.getZoom();
      if (z > 12) {
        map.setMinZoom(z);
        map.setMaxZoom(z);
      } else {
        map.setMinZoom(1);
        map.setMaxZoom(22);
      }
    };
    map.on("zoomend", handleZoom);
    return () => {
      map.off("zoomend", handleZoom);
    };
  }, [map]);
  return null;
}

export default function ProvinceDetail() {
  const { slug } = useParams();
  const [blocksGeoJSON, setBlocksGeoJSON] = useState(null);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  // Load blocks 1 lần để FitBounds khi mở province
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await blockApi.getByProvince(slug);

        if (res?.type === "FeatureCollection") {
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

  // Khi click block
  const handleBlockClick = (feature) => {
    setSelectedBlock(feature);
    setOpenModal(true);
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await blockApi.claim({
        ...values,
        block_ids: [selectedBlock.properties.id], // ✅ lấy id từ block click
      });

      message.success("Mua block thành công!");
      setLoading(false);
      setOpenModal(false);
      form.resetFields();
    } catch (err) {
      console.error("❌ Lỗi mua block:", err);
      message.error("Mua block thất bại!");
      setLoading(false);
    }
  };

  return (
    <>
      <MapContainer
        style={{ height: "100vh", width: "100%" }}
        zoom={6}
        center={[16, 108]}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Khóa zoom khi > 10 */}
        <LockZoomOnHighLevel />

        {/* Hiển thị blocks */}
        {blocksGeoJSON && (
          <BlockLayer provinceId={slug} onBlockClick={handleBlockClick} />
        )}

        {/* Fit map lần đầu */}
        {blocksGeoJSON && <FitBounds geojson={blocksGeoJSON} />}
      </MapContainer>

      {/* Modal mua block */}
      <Modal
        title={`Mua Block #${selectedBlock?.properties?.id || ""}`}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setOpenModal(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            Xác nhận
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên người mua"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
          >
            <Input placeholder="0987xxxxxx" />
          </Form.Item>

          <Form.Item name="label" label="Label (tên block)">
            <Input placeholder="My Block" />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
