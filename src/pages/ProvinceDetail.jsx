import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import BlockLayer from "../components/Map/Layer/BlockLayer";
import FitBounds from "../components/Map/FitBounds";
import blockApi from "../api/blockApi";
import { Modal, Input, Button, Form, message, Row, Col, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

// Khóa zoom khi > 12
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
        map.setMaxZoom(16);
      }
    };
    handleZoom();
    map.on("zoomend", handleZoom);
    return () => map.off("zoomend", handleZoom);
  }, [map]);
  return null;
}

// Preview các block
function BlockPreview({ blocks, color, label, previewUrl }) {
  return (
    <div
      style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
    >
      {blocks.map((b) => (
        <div
          key={b.properties.id}
          style={{
            width: 80,
            height: 20,
            border: "1px solid #ccc",
            borderRadius: 4,
            position: "relative",
            backgroundColor: color || "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {label && (
            <div
              style={{
                position: "relative",
                top: 2,
                left: 2,
                fontSize: 10,
                fontWeight: "bold",
                color: "#000",
              }}
            >
              {label}
            </div>
          )}
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            style={{
              position: "relative",
              fontSize: 10,
              fontWeight: "bold",
              color: "#fff",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: "0 2px",
              borderRadius: 2,
            }}
          >
            #{b.properties.id}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProvinceDetail() {
  const { slug } = useParams();
  const [blocksGeoJSON, setBlocksGeoJSON] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form] = Form.useForm();

  // Load blocks
  useEffect(() => {
    const loadBlocks = async () => {
      try {
        const res = await blockApi.getByProvince(slug);
        if (res?.type === "FeatureCollection") setBlocksGeoJSON(res);
        else if (Array.isArray(res))
          setBlocksGeoJSON({ type: "FeatureCollection", features: res });
        else console.error("Dữ liệu blocks không hợp lệ:", res);
      } catch (err) {
        console.error("Lỗi load blocks:", err);
      }
    };
    loadBlocks();
  }, [slug]);

  // Upload ảnh
  const handleUploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await blockApi.uploadImage(formData);
      return res.path;
    } catch (err) {
      console.error("Upload ảnh thất bại:", err);
      message.error("Upload ảnh thất bại!");
      return null;
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!selectedBlocks.length) {
      message.warning("Vui lòng chọn ít nhất 1 block!");
      return;
    }
    try {
      const values = await form.validateFields();
      setLoading(true);

      let imagePath = null;
      if (values.image?.[0]?.originFileObj) {
        imagePath = await handleUploadImage(values.image[0].originFileObj);
        if (!imagePath) return setLoading(false);
      }

      await blockApi.claim({
        name: values.name,
        phone: values.phone,
        label: values.label || "",
        color: values.color || "",
        block_ids: selectedBlocks.map((b) => b.properties.id),
        image_path: imagePath,
      });

      message.success("Mua blocks thành công!");
      setOpenModal(false);
      form.resetFields();
      setSelectedBlocks([]);
      setPreviewUrl(null);
      setLoading(false);
    } catch (err) {
      console.error("Lỗi mua block:", err);
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
        {blocksGeoJSON && (
          <BlockLayer
            provinceId={slug}
            selectedBlocks={selectedBlocks}
            setSelectedBlocks={setSelectedBlocks}
          />
        )}
        {blocksGeoJSON && <FitBounds geojson={blocksGeoJSON} />}
      </MapContainer>

      {selectedBlocks.length > 0 && (
        <Button
          type="primary"
          style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}
          onClick={() => setOpenModal(true)}
        >
          Mua {selectedBlocks.length} Block
        </Button>
      )}

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
        <BlockPreview
          blocks={selectedBlocks}
          color={form.getFieldValue("color")}
          // label={form.getFieldValue("label")}
          previewUrl={previewUrl}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Tên người mua"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nguyễn Văn A" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[{ required: true }]}
              >
                <Input placeholder="0987xxxxxx" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="label" label="Label (tên block)">
            <Input placeholder="Khu B2" />
          </Form.Item>

          <Form.Item name="color" label="Màu sắc">
            <Input type="color" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Ảnh minh họa"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
              onChange={(info) => {
                const file = info.fileList[0];
                if (file) {
                  const reader = new FileReader();
                  reader.readAsDataURL(file.originFileObj);
                  reader.onload = () => setPreviewUrl(reader.result);
                } else setPreviewUrl(null);
              }}
            >
              {!previewUrl && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
