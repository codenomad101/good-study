import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Divider, Row, Col } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './MegaMenu.css';

const { Text, Title } = Typography;

interface MegaMenuProps {
  onClose?: () => void;
  onCreateExam?: (questions: number) => void;
  onCreateCommunity?: () => void;
}

// Example categories for Practice menu
const exampleCategories = [
  { name: 'Economy', slug: 'economy', icon: '💰', desc: 'Economic concepts & current affairs' },
  { name: 'Agriculture', slug: 'agriculture', icon: '🌾', desc: 'Agricultural science & practices' },
  { name: 'English', slug: 'english', icon: '📚', desc: 'Grammar & language skills' },
  { name: 'History', slug: 'history', icon: '🏛️', desc: 'Indian & world history' },
  { name: 'Geography', slug: 'geography', icon: '🌍', desc: 'Physical & human geography' },
  { name: 'General Knowledge', slug: 'gk', icon: '🧠', desc: 'General awareness & current events' },
  { name: 'Aptitude', slug: 'aptitude', icon: '🔢', desc: 'Quantitative & logical reasoning' },
  { name: 'Marathi', slug: 'marathi', icon: '📖', desc: 'Marathi language & literature' },
];

export const MegaMenu: React.FC<MegaMenuProps> = ({ 
  onClose,
  onCreateExam,
  onCreateCommunity 
}) => {
  const handleCategoryClick = () => {
    if (onClose) onClose();
  };

  const handleExamClick = (questions: number) => {
    if (onCreateExam) onCreateExam(questions);
    if (onClose) onClose();
  };

  const handleCommunityClick = () => {
    if (onCreateCommunity) onCreateCommunity();
    if (onClose) onClose();
  };

  return (
    <div className="mega-menu-container">
      <div className="mega-menu-horizontal-bar">
        {/* Practice Section */}
        <div className="mega-menu-section">
          <div className="mega-menu-section-header">
            <UnorderedListOutlined style={{ fontSize: '16px', marginRight: '6px', color: '#2563EB' }} />
            <Text strong style={{ fontSize: '14px' }}>Practice</Text>
          </div>
          <Link to="/practice" onClick={handleCategoryClick} className="mega-menu-horizontal-item header-item">
            <Text style={{ fontSize: '13px', fontWeight: 600 }}>All Categories</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>View all</Text>
          </Link>
          <Divider type="vertical" style={{ height: '30px', margin: '0 8px' }} />
          {exampleCategories.map((category) => (
            <Link 
              key={category.slug}
              to={`/category/${category.slug}`} 
              onClick={handleCategoryClick}
              className="mega-menu-horizontal-item"
            >
              <span style={{ fontSize: '16px', marginRight: '6px' }}>{category.icon}</span>
              <div className="mega-menu-item-content">
                <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>{category.name}</Text>
                <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>{category.desc}</Text>
              </div>
            </Link>
          ))}
        </div>

        <Divider type="vertical" style={{ height: '60px', margin: '0 12px' }} />

        {/* Exams Section */}
        <div className="mega-menu-section">
          <div className="mega-menu-section-header">
            <FileTextOutlined style={{ fontSize: '16px', marginRight: '6px', color: '#2563EB' }} />
            <Text strong style={{ fontSize: '14px' }}>Exams</Text>
          </div>
          <Link to="/exams" onClick={handleCategoryClick} className="mega-menu-horizontal-item header-item">
            <Text style={{ fontSize: '13px', fontWeight: 600 }}>Exams Page</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>Manage all</Text>
          </Link>
          <Divider type="vertical" style={{ height: '30px', margin: '0 8px' }} />
          <Link to="/exams" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <BookOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Learn from Exams</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Study past</Text>
            </div>
          </Link>
          <Link to="/exams" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <BarChartOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Exam History</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>View results</Text>
            </div>
          </Link>
          <Link to="/exams" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <ClockCircleOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Resume</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Continue</Text>
            </div>
          </Link>
          <Divider type="vertical" style={{ height: '30px', margin: '0 8px' }} />
          <div onClick={() => handleExamClick(20)} className="mega-menu-horizontal-item clickable">
            <PlusOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Quick (20)</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>20 questions</Text>
            </div>
          </div>
          <div onClick={() => handleExamClick(50)} className="mega-menu-horizontal-item clickable">
            <PlusOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Standard (50)</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>50 questions</Text>
            </div>
          </div>
          <div onClick={() => handleExamClick(100)} className="mega-menu-horizontal-item clickable">
            <PlusOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Full (100)</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>100 questions</Text>
            </div>
          </div>
          <Link to="/exams" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <SettingOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Custom</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Configure</Text>
            </div>
          </Link>
        </div>

        <Divider type="vertical" style={{ height: '60px', margin: '0 12px' }} />

        {/* Community Section */}
        <div className="mega-menu-section">
          <div className="mega-menu-section-header">
            <TeamOutlined style={{ fontSize: '16px', marginRight: '6px', color: '#2563EB' }} />
            <Text strong style={{ fontSize: '14px' }}>Community</Text>
          </div>
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item header-item">
            <Text style={{ fontSize: '13px', fontWeight: 600 }}>Your Communities</Text>
            <Text type="secondary" style={{ fontSize: '10px' }}>Manage groups</Text>
          </Link>
          <Divider type="vertical" style={{ height: '30px', margin: '0 8px' }} />
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <UnorderedListOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Browse All</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>All communities</Text>
            </div>
          </Link>
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <SearchOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Find</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Search & discover</Text>
            </div>
          </Link>
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <PlayCircleOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Popular</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Trending now</Text>
            </div>
          </Link>
          <Divider type="vertical" style={{ height: '30px', margin: '0 8px' }} />
          <div onClick={handleCommunityClick} className="mega-menu-horizontal-item clickable">
            <PlusOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Create</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Start new group</Text>
            </div>
          </div>
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <TeamOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>My Communities</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>Your groups</Text>
            </div>
          </Link>
          <Link to="/community" onClick={handleCategoryClick} className="mega-menu-horizontal-item">
            <BarChartOutlined style={{ marginRight: '6px', fontSize: '14px' }} />
            <div className="mega-menu-item-content">
              <Text style={{ fontSize: '12px', display: 'block', fontWeight: 500 }}>Analytics</Text>
              <Text type="secondary" style={{ fontSize: '10px', display: 'block' }}>View insights</Text>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

