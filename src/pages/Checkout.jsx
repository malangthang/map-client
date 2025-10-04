import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Form, Input, Upload, Button, Table, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import orderApi from "../api/orderApi";

const calculateBlockPrice = (block) => {
  let price = block.basePrice || 0;
  if (block.label) price += 10000;
  if (block.image) price += 10000;
  return price;
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialBlocks = location.state?.blocks || [];
  const [blocks, setBlocks] = useState(initialBlocks);
  const [totalPrice, setTotalPrice] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    const total = blocks.reduce((sum, b) => sum + calculateBlockPrice(b), 0);
    setTotalPrice(total);
  }, [blocks]);

  const handleBlockFieldChange = (id, field, value) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const handleBlockImageChange = (id, fileList) => {
    const fileObj = fileList?.[0]?.originFileObj || null;
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, image: fileObj } : b)));
  };

  const handleRemoveBlock = (id) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handlePayment = async () => {
    try {
      const values = await form.validateFields();
      if (!blocks.length) {
        message.warning("Giỏ hàng trống!");
        return;
      }

      // Upload ảnh trước
      const uploadPromises = blocks.map(async (b) => {
        if (b.image) {
          const fd = new FormData();
          fd.append("image", b.image);
          const res = await orderApi.uploadImage(fd);
          return { ...b, image_path: res.path };
        }
        return b;
      });
      const blocksWithPath = await Promise.all(uploadPromises);

      // Tạo order
      const orderPayload = {
        customer_name: values.name,
        customer_phone: values.phone,
        customer_email: values.email,
        blocks: blocksWithPath.map((b) => ({
          block_id: b.id,
          label: b.label,
          color: b.color,
          image_path: b.image_path || null,
        })),
      };

      const res = await orderApi.create(orderPayload);
      if (res?.success) {
        message.success("Đặt hàng thành công!");
        navigate("/");
      } else {
        message.error(res?.message || "Đặt hàng thất bại!");
      }
    } catch (err) {
      console.error(err);
      message.error("Có lỗi xảy ra!");
    }
  };

  const columns = [
    { title: "Block ID", dataIndex: "id", key: "id" },
    {
      title: "Label",
      dataIndex: "label",
      key: "label",
      render: (_, record) => (
        <Input
          value={record.label || ""}
          placeholder="Nhập label"
          onChange={(e) => handleBlockFieldChange(record.id, "label", e.target.value)}
        />
      ),
    },
    {
      title: "Color",
      dataIndex: "color",
      key: "color",
      render: (_, record) => (
        <Input
          type="color"
          value={record.color || "#3388ff"}
          onChange={(e) => handleBlockFieldChange(record.id, "color", e.target.value)}
        />
      ),
    },
    {
      title: "Image",
      dataIndex: "image",
      key: "image",
      render: (_, record) => (
        <>
          <Upload
            maxCount={1}
            beforeUpload={() => false}
            onChange={(info) => handleBlockImageChange(record.id, info.fileList)}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
          {record.image && (
            <img
              src={typeof record.image === "string" ? record.image : URL.createObjectURL(record.image)}
              alt="block"
              style={{ width: 60, height: 60, marginTop: 4, objectFit: "cover" }}
            />
          )}
        </>
      ),
    },
    {
      title: "Price",
      key: "price",
      render: (_, record) => calculateBlockPrice(record).toLocaleString() + "₫",
    },
    {
      title: "Xóa",
      key: "delete",
      render: (_, record) => (
        <Button danger onClick={() => handleRemoveBlock(record.id)}>
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <Form form={form} layout="vertical" initialValues={{ name: "", phone: "", email: "" }}>
        <Form.Item
          label="Họ và tên"
          name="name"
          rules={[{ required: true, message: "Nhập họ và tên" }]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại"
          name="phone"
          rules={[{ required: true, message: "Nhập số điện thoại" }]}
        >
          <Input placeholder="0987xxxxxx" />
        </Form.Item>
        <Form.Item label="Email" name="email">
          <Input placeholder="Email (tùy chọn)" />
        </Form.Item>
      </Form>

      <Table
        dataSource={blocks}
        columns={columns}
        rowKey="id"
        pagination={false}
        className="mb-4"
      />

      <div className="text-right font-bold text-xl mb-4">
        Tổng: {totalPrice.toLocaleString()}₫
      </div>

      <Button type="primary" onClick={handlePayment}>
        Thanh toán
      </Button>
    </div>
  );
}
