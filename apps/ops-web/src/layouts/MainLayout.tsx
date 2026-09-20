import type { OpsRole } from '@/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { MERCHANT_OPS_ROLES, PLATFORM_ROLES, primaryOpsRole } from '@/lib/roles';
import type { ReactNode } from 'react';
import {
  AuditOutlined,
  CarOutlined,
  DashboardOutlined,
  InboxOutlined,
  LogoutOutlined,
  ShopOutlined,
  ShoppingOutlined,
  TeamOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, Typography } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

type MenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  roles?: OpsRole[];
};

const ALL_MENU: MenuItem[] = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/merchants', icon: <ShopOutlined />, label: '商家管理', roles: PLATFORM_ROLES },
  { key: '/products', icon: <ShoppingOutlined />, label: '商品库存', roles: MERCHANT_OPS_ROLES },
  { key: '/orders', icon: <InboxOutlined />, label: '订单工作台', roles: MERCHANT_OPS_ROLES },
  { key: '/dispatch', icon: <CarOutlined />, label: '调度台', roles: PLATFORM_ROLES },
  { key: '/riders', icon: <TeamOutlined />, label: '骑手白名单', roles: PLATFORM_ROLES },
  { key: '/finance', icon: <WarningOutlined />, label: '退款/对账', roles: PLATFORM_ROLES },
  { key: '/audit', icon: <AuditOutlined />, label: '审计日志', roles: PLATFORM_ROLES },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const role = user ? primaryOpsRole(user.roles) : null;

  const menuItems = ALL_MENU.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  );

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
          <Typography.Text>
            {user?.displayName}
            {user?.merchantId ? ` · ${user.merchantId}` : ''}
          </Typography.Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={() => void logout()}>
            退出
          </Button>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
