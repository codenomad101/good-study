import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Button, 
  Avatar, 
  Dropdown, 
  Space, 
  Typography,
  Badge,
  Drawer,
  ConfigProvider,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  MenuOutlined,
  BellOutlined,
  SettingOutlined,
  CrownOutlined,
  FileTextOutlined,
  BookOutlined,
  FileTextOutlined as ExamIcon,
  TeamOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';
import './Header.css';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
  showAuth?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showAuth = true }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  // Set open keys based on current path
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/practice')) {
      setOpenKeys(['/practice']);
    } else if (path.startsWith('/exams') || path.startsWith('/exam/')) {
      setOpenKeys(['/exams']);
    } else if (path.startsWith('/community')) {
      setOpenKeys(['/community']);
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname]);

  const userMenu = (
    <Menu 
      className="user-dropdown-menu"
      style={{ 
        minWidth: '200px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        padding: '4px 0',
        background: '#ffffff'
      }}
    >
      {/* User Info Header */}
      <div className="user-info-section">
        <div className="user-name">
          {user?.fullName}
        </div>
        <div className="user-role">
          {user?.role}
        </div>
      </div>
      
      <Menu.Item 
        key="profile" 
        className="dropdown-menu-item"
      >
        <Link to="/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item 
        key="leaderboard" 
        className="dropdown-menu-item"
      >
        <Link to="/leaderboard">Leaderboard</Link>
      </Menu.Item>
      <Menu.Item 
        key="notes" 
        className="dropdown-menu-item"
      >
        <Link to="/notes">Notes</Link>
      </Menu.Item>
      <Menu.Item 
        key="settings" 
        className="dropdown-menu-item"
      >
        <Link to="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item 
        key="pricing" 
        className="dropdown-menu-item"
      >
        <Link to="/pricing">Plans & Pricing</Link>
      </Menu.Item>
      
      {/* Admin Panel - Only show for admin users */}
      {user?.role === 'admin' && (
        <>
          <Menu.Divider className="menu-divider" />
          <Menu.Item 
            key="admin" 
            className="dropdown-menu-item admin-item"
          >
            <Link to="/admin">
              <CrownOutlined style={{ marginRight: '8px', color: '#f59e0b' }} />
              Admin Panel
            </Link>
          </Menu.Item>
        </>
      )}
      
      <Menu.Divider className="menu-divider" />
      <Menu.Item 
        key="logout" 
        onClick={handleLogout}
        className="dropdown-menu-item logout-item"
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  // Different menu items based on authentication status
  const authenticatedMenuItems = [
    {
      key: '/dashboard',
      label: <Link to="/dashboard">Dashboard</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/practice',
      label: <Link to="/practice">Practice</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/exams',
      label: <Link to="/exams">Exams</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/community',
      label: <Link to="/community">Community</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/help',
      label: <Link to="/help">Help</Link>,
      className: 'nav-menu-item'
    },
  ];

  const unauthenticatedMenuItems = [
    {
      key: '/',
      label: <Link to="/">Home</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/about',
      label: <Link to="/about">About</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/help',
      label: <Link to="/help">Help</Link>,
      className: 'nav-menu-item'
    },
    {
      key: '/contact',
      label: <Link to="/contact">Contact</Link>,
      className: 'nav-menu-item'
    },
  ];

  const mainMenuItems = isAuthenticated ? authenticatedMenuItems : unauthenticatedMenuItems;

  // Flatten menu items for mobile
  const flattenMenuItems = (items: any[]): any[] => {
    const flattened: any[] = [];
    items.forEach(item => {
      // Extract the actual label from React element if needed
      let label = item.label;
      if (React.isValidElement(item.label)) {
        // For mega menu triggers, just use the text
        if (item.key === '/practice') label = <Link to="/practice">Practice</Link>;
        else if (item.key === '/exams') label = <Link to="/exams">Exams</Link>;
        else if (item.key === '/community') label = <Link to="/community">Community</Link>;
        else label = item.label;
      }
      flattened.push({
        key: item.key,
        label: label
      });
    });
    return flattened;
  };

  const mobileMenuItems = [
    ...flattenMenuItems(mainMenuItems),
    ...(isAuthenticated ? [] : [
      {
        key: '/about',
        label: <Link to="/about">About</Link>,
      },
      {
        key: '/contact',
        label: <Link to="/contact">Contact</Link>,
      },
    ]),
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#2563EB',
          borderRadius: 20,
        },
      }}
    >
      <AntHeader className="main-header">
        <div className="header-container">
          {/* Logo */}
          <div className="header-left">
            <Link 
              to={isAuthenticated ? '/dashboard' : '/'} 
              className="logo-link"
            >
              <div className="logo-container" style={{ position: 'relative' }}>
                <img 
                  src="/assets/padhero logo.svg" 
                  alt="Padhero" 
                  className="logo-image"
                  style={{
                    height: '44px',
                    width: 'auto',
                    objectFit: 'contain',
                    borderRadius: '10px'
                  }}
                />
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <Menu 
              theme="light" 
              mode="horizontal" 
              selectedKeys={[location.pathname]} 
              items={mainMenuItems}
              className="nav-menu"
            />
          </div>

          {/* Right Side */}
          <div className="header-right">
          {/* Notifications - Only show when authenticated */}
          {isAuthenticated && (
            <div className="notification-wrapper">
              <NotificationDropdown />
            </div>
          )}

          {/* Authentication */}
          {showAuth && (
            <>
              {isAuthenticated ? (
                <div className="user-dropdown-wrapper">
                  <Dropdown 
                    overlay={userMenu} 
                    placement="bottomRight" 
                    arrow 
                    trigger={['click']}
                    overlayClassName="user-dropdown-overlay"
                  >
                    <div className="user-avatar-trigger">
                      <Avatar 
                        size={28} 
                        src={user?.profilePictureUrl}
                        icon={<UserOutlined />} 
                        className="user-avatar"
                      />
                      <span className="user-name-trigger">{user?.fullName?.split(' ')[0]}</span>
                    </div>
                  </Dropdown>
                </div>
              ) : (
                <Space size="small" className="auth-buttons">
                  <Link to="/login">
                    <Button 
                      type="text" 
                      className="login-btn"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button 
                      type="primary" 
                      className="signup-btn"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </Space>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setDrawerVisible(true)}
            className="mobile-menu-btn"
          />
          </div>
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title={
            <div className="drawer-title" style={{ fontWeight: 'bold', fontStyle: 'italic' }}>
              <span style={{ 
                color: '#7f8f9d',
                fontFamily: 'Anton, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'italic'
              }}>G</span>
              <span style={{ 
                color: '#160676',
                fontFamily: 'Anton, sans-serif',
                fontWeight: 'bold',
                fontStyle: 'italic',
                position: 'relative'
              }}>
                S
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  color: '#160676',
                  fontSize: '14px',
                  transform: 'rotate(-45deg)',
                  fontWeight: 'bold'
                }}>&gt;</span>
              </span>
            </div>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={280}
          className="mobile-drawer"
        >
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={mobileMenuItems}
            className="mobile-menu"
          />
          
          {isAuthenticated && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <Menu
                mode="vertical"
                className="mobile-menu"
              >
                <Menu.Item key="profile-mobile">
                  <Link to="/profile">Profile</Link>
                </Menu.Item>
                <Menu.Item key="leaderboard-mobile">
                  <Link to="/leaderboard">Leaderboard</Link>
                </Menu.Item>
                <Menu.Item key="notes-mobile">
                  <Link to="/notes">Notes</Link>
                </Menu.Item>
                <Menu.Item key="settings-mobile">
                  <Link to="/settings">Settings</Link>
                </Menu.Item>
                <Menu.Item key="pricing-mobile">
                  <Link to="/pricing">Plans & Pricing</Link>
                </Menu.Item>
                <Menu.Item 
                  key="logout-mobile" 
                  onClick={handleLogout}
                  className="logout-item"
                >
                  Logout
                </Menu.Item>
              </Menu>
            </>
          )}
        </Drawer>

      </AntHeader>
    </ConfigProvider>
  );
};