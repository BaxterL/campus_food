import { merchantApi, productApi } from '@/api/client';
import type { ProductCreateInput } from '@/api/types';
import { AsyncState } from '@/components/AsyncState';
import { useAuth } from '@/contexts/AuthContext';
import { formatCents, formatDateTime } from '@/lib/format';
import { isMerchantStaff, isPlatformRole, primaryOpsRole } from '@/lib/roles';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useState } from 'react';

export function ProductListPage() {
  const { user } = useAuth();
  const role = user ? primaryOpsRole(user.roles) : null;
  const isPlatform = role ? isPlatformRole(role) : false;
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [merchantFilter, setMerchantFilter] = useState<string>();
  const [editId, setEditId] = useState<string | null>(null);
  const [stock, setStock] = useState(0);
  const [isOnSale, setIsOnSale] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: ['products', page, merchantFilter],
    queryFn: () =>
      productApi.list({
        page,
        pageSize: 20,
        ...(merchantFilter ? { merchantId: merchantFilter } : {}),
      }),
  });

  const merchantsQuery = useQuery({
    queryKey: ['merchants', 'product-filter'],
    queryFn: () => merchantApi.list({ page: 1, pageSize: 100, reviewStatus: 'approved' }),
    enabled: isPlatform,
  });

  const updateMut = useMutation({
    mutationFn: () => productApi.updateInventory(editId!, { stock, isOnSale }),
    onSuccess: () => {
      message.success('库存已更新');
      setEditId(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (e: Error) => message.error(e.message),
  });

  const openEdit = (record: { id: string; stock: number; isOnSale: boolean }) => {
    setEditId(record.id);
    setStock(record.stock);
    setIsOnSale(record.isOnSale);
  };

  const columns = [
    ...(role && isMerchantStaff(role)
      ? []
      : [{ title: '商家', dataIndex: 'merchantName', key: 'merchantName' }]),
    {
      title: '商品',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: { imageUrl?: string }) => (
        <Space>
          {record.imageUrl ? (
            <img
              src={record.imageUrl}
              alt=""
              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4 }}
            />
          ) : null}
          <span>{name}</span>
        </Space>
      ),
    },
    { title: '分类', dataIndex: 'categoryName', key: 'categoryName' },
    { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode' },
    {
      title: '售价',
      dataIndex: 'priceCents',
      key: 'priceCents',
      render: (v: number) => formatCents(v),
    },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '预占', dataIndex: 'reservedStock', key: 'reservedStock' },
    {
      title: '上架',
      dataIndex: 'isOnSale',
      key: 'isOnSale',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag>,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v: string) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: { id: string; stock: number; isOnSale: boolean }) => (
        <Button size="small" onClick={() => openEdit(record)}>调库存</Button>
      ),
    },
  ];

  const merchantOptions = (merchantsQuery.data?.items ?? []).map((m) => ({
    value: m.id,
    label: m.name,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>商品与库存</Typography.Title>
        <Space>
          {isPlatform && (
            <Select
              allowClear
              placeholder="按商家筛选"
              style={{ width: 180 }}
              value={merchantFilter}
              onChange={(v) => {
                setMerchantFilter(v);
                setPage(1);
              }}
              options={merchantOptions}
              loading={merchantsQuery.isLoading}
            />
          )}
          <Button type="primary" onClick={() => setCreateOpen(true)}>新建商品</Button>
        </Space>
      </div>

      <AsyncState loading={listQuery.isLoading} error={listQuery.error} empty={!listQuery.data?.items.length}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={listQuery.data?.items}
          pagination={{
            current: page,
            pageSize: 20,
            total: listQuery.data?.total,
            onChange: setPage,
          }}
        />
      </AsyncState>

      <Modal
        open={!!editId}
        title="调整库存"
        onCancel={() => setEditId(null)}
        onOk={() => updateMut.mutate()}
        confirmLoading={updateMut.isPending}
      >
        <Form layout="vertical">
          <Form.Item label="库存数量">
            <InputNumber min={0} value={stock} onChange={(v) => setStock(v ?? 0)} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="是否上架">
            <Switch checked={isOnSale} onChange={setIsOnSale} />
          </Form.Item>
        </Form>
      </Modal>

      <CreateProductModal
        open={createOpen}
        isPlatform={isPlatform}
        merchantId={user?.merchantId}
        merchantOptions={merchantOptions}
        onCancel={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }}
      />
    </div>
  );
}

interface CreateProductModalProps {
  open: boolean;
  isPlatform: boolean;
  merchantId?: string;
  merchantOptions: { value: string; label: string }[];
  onCancel: () => void;
  onSuccess: () => void;
}

function CreateProductModal({
  open,
  isPlatform,
  merchantId,
  merchantOptions,
  onCancel,
  onSuccess,
}: CreateProductModalProps) {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>();
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [skuName, setSkuName] = useState('默认');
  const [priceYuan, setPriceYuan] = useState<number>(0);
  const [stock, setStock] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const effectiveMerchantId = isPlatform ? selectedMerchantId : merchantId;

  useEffect(() => {
    if (!open) return;
    setSelectedMerchantId(undefined);
    setName('');
    setCategoryName('');
    setSkuName('默认');
    setPriceYuan(0);
    setStock(0);
    setImageUrl('');
  }, [open]);

  const createMut = useMutation({
    mutationFn: (input: ProductCreateInput) => productApi.create(input),
    onSuccess: () => {
      message.success('商品已创建');
      onSuccess();
    },
    onError: (e: Error) => message.error(e.message),
  });

  const handleUpload = async (file: UploadFile) => {
    if (!file.originFileObj) return false;
    setUploading(true);
    try {
      const result = await productApi.uploadImage(file.originFileObj);
      setImageUrl(result.imageUrl);
      message.success('图片已上传');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSubmit = () => {
    if (!effectiveMerchantId) {
      message.error(isPlatform ? '请选择商家' : '未绑定商家账号');
      return;
    }
    if (!name.trim()) {
      message.error('请输入商品名称');
      return;
    }
    if (priceYuan <= 0) {
      message.error('请输入有效售价');
      return;
    }
    createMut.mutate({
      merchantId: effectiveMerchantId,
      name: name.trim(),
      categoryName: categoryName.trim() || undefined,
      skuName: skuName.trim() || '默认',
      priceCents: Math.round(priceYuan * 100),
      stock,
      imageUrl: imageUrl.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      title="新建商品"
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={createMut.isPending}
      destroyOnClose
      width={520}
    >
      <Form layout="vertical">
        {isPlatform && (
          <Form.Item label="商家" required>
            <Select
              placeholder="选择商家"
              value={selectedMerchantId}
              onChange={setSelectedMerchantId}
              options={merchantOptions}
            />
          </Form.Item>
        )}
        <Form.Item label="商品名称" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：麻辣香锅套餐" />
        </Form.Item>
        <Form.Item label="分类" extra="不存在时将自动创建">
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="如：主食"
            disabled={!effectiveMerchantId}
          />
        </Form.Item>
        <Form.Item label="规格名称">
          <Input value={skuName} onChange={(e) => setSkuName(e.target.value)} placeholder="默认" />
        </Form.Item>
        <Form.Item label="售价（元）" required>
          <InputNumber
            min={0.01}
            step={0.5}
            precision={2}
            value={priceYuan}
            onChange={(v) => setPriceYuan(v ?? 0)}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="初始库存">
          <InputNumber min={0} value={stock} onChange={(v) => setStock(v ?? 0)} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="图片">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="图片 URL，或上传本地图片"
            />
            <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
              <Button icon={<UploadOutlined />} loading={uploading}>上传图片</Button>
            </Upload>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="预览"
                style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
              />
            ) : null}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
