import React from 'react';
import { Layout } from 'antd';
import { Header } from './Header';
import { Footer } from './Footer';
import { useAuth } from '../contexts/AuthContext';

const { Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
  showAuth?: boolean;
  showFooter?: boolean;
  contentStyle?: React.CSSProperties;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  showAuth = true, 
  showFooter,
  contentStyle = {}
}) => {
  const { isAuthenticated } = useAuth();
  
  // Show footer only when authenticated, unless explicitly overridden
  const shouldShowFooter = showFooter !== undefined ? showFooter : isAuthenticated;

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header showAuth={showAuth} />
      <Content style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        ...contentStyle 
      }}>
        {children}
      </Content>
      {shouldShowFooter && <Footer />}
    </Layout>
  );
};
