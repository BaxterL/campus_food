import { DevIdentitySwitch } from '@/components/DevIdentitySwitch';
import { useAuth } from '@/contexts/AuthContext';
import {
  AuditOutlined,
  CarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/merchants', icon: <ShopOutlined />, label: '商家管理' },
  { key: '/products', icon: <ShoppingOutlined />, label: '商品库存' },
  { key: '/orders', icon: <ShoppingOutlined />, label: '订单工作台' },
  { key: '/dispatch', icon: <CarOutlined />, label: '调度台' },
  { key: '/riders', icon: <TeamOutlined />, label: '骑手白名单' },
  { key: '/finance', icon: <WarningOutlined />, label: '退款/对账' },
  { key: '/audit', icon: <AuditOutlined />, label: '审计日志' },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, logout } = useAuth();

  const selectedKey =
    menuItems.find((item) => item.key !== '/' && location.pathname.startsWith(item.key))?.key ??
    '/';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={64}>
        <div style={{ padding: '16px 12px' }}>
          <Typography.Title level={5} style={{ color: '#fff', margin: 0 }}>
            校园外卖
          </Typography.Title>
          <Typography.Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            运营后台
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Typography.Text>{identity?.displayName}</Typography.Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <DevIdentitySwitch />
            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>
              退出
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
