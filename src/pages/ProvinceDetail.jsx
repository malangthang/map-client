import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useState } from "react";
import BlockLayer from "../components/Map/Layer/BlockLayer";
import FitBounds from "../components/Map/FitBounds";
import blockApi from "../api/blockApi";
import orderApi from "../api/orderApi";
import { Modal, Input, Button, Form, Upload } from "antd";
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

export default function ProvinceDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blocksGeoJSON, setBlocksGeoJSON] = useState(null);
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(null);
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

  // Click block để add vào giỏ hàng / chỉnh sửa
  const handleBlockClick = (block) => {
    const exists = selectedBlocks.find((b) => b.id === block.properties.id);
    if (!exists) {
      setCurrentBlock({
        id: block.properties.id,
        basePrice: block.properties.price || 0,
        label: "",
        color: "#FF0000",
        image: null,
      });
      setPreviewUrl(null);
      setModalOpen(true);
    }
  };

  // Save block từ modal vào giỏ hàng
  const handleModalSave = () => {
    form.validateFields().then((values) => {
      const newBlock = {
        ...currentBlock,
        label: values.label || "",
        color: values.color || "#FF0000",
        image: values.image?.[0]?.originFileObj || null,
      };
      setSelectedBlocks([...selectedBlocks, newBlock]);
      setModalOpen(false);
      form.resetFields();
    });
  };

  // Đi tới checkout
  const handleCheckout = () => {
    if (!selectedBlocks.length) return;
    navigate("/checkout", { state: { blocks: selectedBlocks } });
  };

  return (
    <>
      <MapContainer style={{ height: "100vh", width: "100%" }} zoom={6} center={[16, 108]}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LockZoomOnHighLevel />
        {blocksGeoJSON && (
          <BlockLayer
            provinceId={slug}
            selectedBlocks={selectedBlocks}
            onBlockClick={handleBlockClick}
          />
        )}
        {blocksGeoJSON && <FitBounds geojson={blocksGeoJSON} />}
      </MapContainer>

      {selectedBlocks.length > 0 && (
        <Button
          type="primary"
          style={{ position: "absolute", top: 20, right: 20, zIndex: 1000 }}
          onClick={handleCheckout}
        >
          Thanh toán ({selectedBlocks.length} block)
        </Button>
      )}

      <Modal
        title={`Thêm thông tin Block #${currentBlock?.id}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)}>
            Hủy
          </Button>,
          <Button key="save" type="primary" onClick={handleModalSave}>
            Thêm vào giỏ
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" initialValues={{ color: "#FF0000" }}>
          <Form.Item name="label" label="Label (tên block)">
            <Input placeholder="Nhập label" />
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
