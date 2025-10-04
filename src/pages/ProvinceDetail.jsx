import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import BlockLayer from "../components/Map/Layer/BlockLayer";
import FitBounds from "../components/Map/FitBounds";
import blockApi from "../api/blockApi";
import { Modal, Input, Button, Form, message, Tag, Row, Col } from "antd";

// Component nhỏ để khóa zoom khi zoom > 12
function LockZoomOnHighLevel() {
  const map = useMap();

  useEffect(() => {
    const handleZoom = () => {
      const z = map.getZoom();
      if (z > 12) {
        // ✅ Khóa không cho zoom nhỏ lại
        map.setMinZoom(12);
        map.setMaxZoom(z); // cho phép zoom in thêm
      } else {
        // ✅ Nếu reset hoặc fitBounds đưa zoom <= 12 thì mở lại zoom nhỏ
        map.setMinZoom(1);
        map.setMaxZoom(16);
      }
    };

    handleZoom(); // chạy ngay khi load
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

  // State chọn nhiều block
  const [selectedBlocks, setSelectedBlocks] = useState([]);

  // Modal state
  const [openModal, setOpenModal] = useState(false);
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

  // Submit form
  const handleSubmit = async () => {
    if (selectedBlocks.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 block để mua!");
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      await blockApi.claim({
        ...values,
        block_ids: selectedBlocks.map((b) => b.properties.id), // ✅ lấy tất cả id
      });

      message.success("Mua blocks thành công!");
      setLoading(false);
      setOpenModal(false);
      form.resetFields();
      setSelectedBlocks([]); // clear sau khi mua
    } catch (err) {
      console.error("❌ Lỗi mua block:", err);
      message.error("Mua blocks thất bại!");
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

        <LockZoomOnHighLevel />

        {/* Hiển thị blocks */}
        {blocksGeoJSON && (
          <BlockLayer
            provinceId={slug}
            selectedBlocks={selectedBlocks}
            setSelectedBlocks={setSelectedBlocks}
          />
        )}

        {/* Fit map lần đầu */}
        {blocksGeoJSON && <FitBounds geojson={blocksGeoJSON} />}
      </MapContainer>

      {/* Nút mở modal khi có block được chọn */}
      {selectedBlocks.length > 0 && (
        <Button
          type="primary"
          style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}
          onClick={() => setOpenModal(true)}
        >
          Mua {selectedBlocks.length} Block
        </Button>
      )}

      {/* Modal mua blocks */}
      <Modal
        title={`Mua ${selectedBlocks.length} Block`}
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
        <div style={{ marginBottom: 12 }}>
          {selectedBlocks.map((b) => (
            <Tag style={{ marginBottom: 8 }} key={b.properties.id}>
              #{b.properties.id}
            </Tag>
          ))}
        </div>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên người mua"
                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
              >
                <Input placeholder="0987xxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="label" label="Label (tên block)">
            <Input placeholder="My Blocks" />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <Input type="color" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
