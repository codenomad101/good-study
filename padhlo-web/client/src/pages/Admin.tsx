import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Upload, 
  message, 
  Space, 
  Tag, 
  Popconfirm,
  Typography,
  Divider,
  Tabs,
  Progress,
  Alert,
  Badge,
  Tooltip
} from 'antd';
import { 
  DashboardOutlined, 
  UserOutlined, 
  FolderOutlined, 
  QuestionCircleOutlined, 
  UploadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CrownOutlined,
  BarChartOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { AppLayout } from '../components/AppLayout';
import { adminAPI } from '../services/api';

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCategories: number;
  totalQuestions: number;
  totalImports: number;
}

interface Category {
  categoryId: string;
  name: string;
  description: string;
  slug: string;
  color: string;
  language: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  questionsPerSession: number;
  status: string;
  createdAt: string;
}

interface Question {
  questionId: string;
  categoryId: string;
  questionText: string;
  options: Array<{ id: number; text: string }>;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  job: string[];
  status: string;
  createdAt: string;
}

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  subscriptionType: string;
  totalPoints: number;
  level: number;
  isActive: boolean;
  createdAt: string;
}

interface ImportLog {
  importId: string;
  fileName: string;
  fileSize: number;
  totalQuestions: number;
  importedQuestions: number;
  skippedQuestions: number;
  errorCount: number;
  status: string;
  createdAt: string;
  categoryName: string;
}

const AdminPage: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Dashboard
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm] = Form.useForm();
  
  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Users
  const [users, setUsers] = useState<User[]>([]);
  
  // Import
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importForm] = Form.useForm();
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);

  useEffect(() => {
    loadDashboardStats();
    loadCategories();
    loadUsers();
    loadImportLogs();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      message.error('Failed to load dashboard statistics');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to load categories');
    }
  };

  const loadQuestions = async (categoryId?: string) => {
    try {
      const params = categoryId ? { categoryId } : {};
      const response = await adminAPI.getQuestions(params);
      setQuestions(response.data);
    } catch (error) {
      message.error('Failed to load questions');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to load users');
    }
  };

  const loadImportLogs = async () => {
    try {
      const response = await adminAPI.getImportLogs();
      setImportLogs(response.data);
    } catch (error) {
      message.error('Failed to load import logs');
    }
  };

  const handleCreateCategory = async (values: any) => {
    try {
      setLoading(true);
      await adminAPI.createCategory(values);
      message.success('Category created successfully');
      setCategoryModalVisible(false);
      categoryForm.resetFields();
      loadCategories();
    } catch (error) {
      message.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (values: any) => {
    if (!editingCategory) return;
    
    try {
      setLoading(true);
      await adminAPI.updateCategory(editingCategory.categoryId, values);
      message.success('Category updated successfully');
      setCategoryModalVisible(false);
      setEditingCategory(null);
      categoryForm.resetFields();
      loadCategories();
    } catch (error) {
      message.error('Failed to update category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await adminAPI.deleteCategory(categoryId);
      message.success('Category deleted successfully');
      loadCategories();
    } catch (error) {
      message.error('Failed to delete category');
    }
  };

  const handleImportQuestions = async (values: any) => {
    try {
      setLoading(true);
      const { categoryId, file } = values;
      
      console.log('Import values:', { categoryId, file });
      
      // Handle file from Ant Design Upload component
      let fileToUpload = null;
      if (file && file.length > 0) {
        fileToUpload = file[0].originFileObj || file[0];
      }
      
      if (!fileToUpload) {
        message.error('Please select a file to upload');
        return;
      }
      
      if (!categoryId) {
        message.error('Please select a category');
        return;
      }
      
      console.log('Uploading file:', fileToUpload.name, 'to category:', categoryId);
      
      const result = await adminAPI.importQuestions(categoryId, fileToUpload);
      message.success(`Successfully imported ${result.data.importedQuestions} questions`);
      setImportModalVisible(false);
      importForm.resetFields();
      loadCategories();
      loadQuestions();
      loadImportLogs();
    } catch (error) {
      console.error('Import error:', error);
      message.error('Failed to import questions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      await adminAPI.updateUser(userId, userData);
      message.success('User updated successfully');
      loadUsers();
    } catch (error) {
      message.error('Failed to update user');
    }
  };

  const categoryColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => (
        <Space>
          <div 
            style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: record.color 
            }} 
          />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Questions',
      dataIndex: 'totalQuestions',
      key: 'totalQuestions',
      render: (count: number) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      render: (lang: string) => <Tag>{lang.toUpperCase()}</Tag>,
    },
    {
      title: 'Time Limit',
      dataIndex: 'timeLimitMinutes',
      key: 'timeLimitMinutes',
      render: (minutes: number) => `${minutes} min`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Category) => (
        <Space>
          <Tooltip title="Edit Category">
            <Button 
              icon={<EditOutlined />} 
              size="small"
              onClick={() => {
                setEditingCategory(record);
                categoryForm.setFieldsValue(record);
                setCategoryModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete Category">
            <Popconfirm
              title="Are you sure you want to delete this category?"
              description="This will also delete all questions in this category."
              onConfirm={() => handleDeleteCategory(record.categoryId)}
              okText="Yes"
              cancelText="No"
            >
              <Button 
                icon={<DeleteOutlined />} 
                size="small" 
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const questionColumns = [
    {
      title: 'Question',
      dataIndex: 'questionText',
      key: 'questionText',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'Difficulty',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => (
        <Tag color={difficulty === 'easy' ? 'green' : difficulty === 'medium' ? 'orange' : 'red'}>
          {difficulty.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Job',
      dataIndex: 'job',
      key: 'job',
      render: (job: any) => {
        // Handle both array and string formats
        const jobArray = Array.isArray(job) ? job : (typeof job === 'string' ? job.split(',').map(j => j.trim()) : []);
        return (
          <Space wrap>
            {jobArray.map((j, index) => (
              <Tag key={index} color="blue">
                {j}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Question) => (
        <Popconfirm
          title="Are you sure you want to delete this question?"
          onConfirm={() => adminAPI.deleteQuestion(record.questionId)}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<DeleteOutlined />} size="small" danger>
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : role === 'moderator' ? 'orange' : 'blue'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Subscription',
      dataIndex: 'subscriptionType',
      key: 'subscriptionType',
      render: (type: string) => (
        <Tag color={type === 'premium' ? 'gold' : 'default'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Select
            defaultValue={record.role}
            style={{ width: 100 }}
            onChange={(value) => handleUpdateUser(record.userId, { role: value })}
          >
            <Option value="student">Student</Option>
            <Option value="moderator">Moderator</Option>
            <Option value="admin">Admin</Option>
          </Select>
          <Select
            defaultValue={record.subscriptionType}
            style={{ width: 100 }}
            onChange={(value) => handleUpdateUser(record.userId, { subscriptionType: value })}
          >
            <Option value="free">Free</Option>
            <Option value="premium">Premium</Option>
          </Select>
        </Space>
      ),
    },
  ];

  const importLogColumns = [
    {
      title: 'File Name',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: 'Category',
      dataIndex: 'categoryName',
      key: 'categoryName',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'orange'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Imported',
      key: 'imported',
      render: (record: ImportLog) => (
        <Text>
          {record.importedQuestions}/{record.totalQuestions}
        </Text>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const renderDashboard = () => (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <DashboardOutlined style={{ marginRight: '12px', color: '#FF7846' }} />
          Dashboard
        </Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={loadDashboardStats}
          loading={loading}
        >
          Refresh
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats?.totalUsers || 0}
              prefix={<UserOutlined style={{ color: '#FF7846' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats?.activeUsers || 0}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Categories"
              value={stats?.totalCategories || 0}
              prefix={<FolderOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Questions"
              value={stats?.totalQuestions || 0}
              prefix={<QuestionCircleOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card title="Recent Import Logs" extra={<Button size="small">View All</Button>}>
            <Table
              columns={importLogColumns}
              dataSource={(importLogs || []).slice(0, 5)}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingCategory(null);
                  categoryForm.resetFields();
                  setCategoryModalVisible(true);
                }}
                block
              >
                Create New Category
              </Button>
              <Button 
                icon={<UploadOutlined />}
                onClick={() => setImportModalVisible(true)}
                block
              >
                Import Questions
              </Button>
              <Button 
                icon={<UserOutlined />}
                onClick={() => setSelectedMenu('users')}
                block
              >
                Manage Users
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderCategories = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <FolderOutlined style={{ marginRight: '12px', color: '#722ed1' }} />
          Categories
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCategory(null);
            categoryForm.resetFields();
            setCategoryModalVisible(true);
          }}
        >
          Add Category
        </Button>
      </div>
      <Table
        columns={categoryColumns}
        dataSource={categories}
        rowKey="categoryId"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderQuestions = () => (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <QuestionCircleOutlined style={{ marginRight: '12px', color: '#fa8c16' }} />
          Questions
        </Title>
        <Space>
          <Select
            placeholder="Filter by category"
            style={{ width: 200 }}
            onChange={(value) => {
              setSelectedCategory(value);
              loadQuestions(value);
            }}
            allowClear
          >
            {categories.map(category => (
              <Option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            icon={<UploadOutlined />}
            onClick={() => setImportModalVisible(true)}
          >
            Import Questions
          </Button>
        </Space>
      </div>
      <Table
        columns={questionColumns}
        dataSource={questions}
        rowKey="questionId"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderUsers = () => (
    <div>
      <Title level={2} style={{ marginBottom: '16px' }}>
        <UserOutlined style={{ marginRight: '12px', color: '#FF7846' }} />
        Users
      </Title>
      <Table
        columns={userColumns}
        dataSource={users}
        rowKey="userId"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const renderImportLogs = () => (
    <div>
      <Title level={2} style={{ marginBottom: '16px' }}>
        <FileTextOutlined style={{ marginRight: '12px', color: '#52c41a' }} />
        Import Logs
      </Title>
      <Table
        columns={importLogColumns}
        dataSource={importLogs}
        rowKey="importId"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'categories', icon: <FolderOutlined />, label: 'Categories' },
    { key: 'questions', icon: <QuestionCircleOutlined />, label: 'Questions' },
    { key: 'users', icon: <UserOutlined />, label: 'Users' },
    { key: 'imports', icon: <FileTextOutlined />, label: 'Import Logs' },
  ];

  return (
    <AppLayout>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          style={{ background: '#fff' }}
        >
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <CrownOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />
            {!collapsed && (
              <Title level={4} style={{ margin: '8px 0 0 0' }}>
                Admin Panel
              </Title>
            )}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedMenu]}
            items={menuItems}
            onClick={({ key }) => setSelectedMenu(key)}
          />
        </Sider>
        
        <Layout>
          <Content style={{ padding: '24px', background: '#f5f5f5' }}>
            {selectedMenu === 'dashboard' && renderDashboard()}
            {selectedMenu === 'categories' && renderCategories()}
            {selectedMenu === 'questions' && renderQuestions()}
            {selectedMenu === 'users' && renderUsers()}
            {selectedMenu === 'imports' && renderImportLogs()}
          </Content>
        </Layout>
      </Layout>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        open={categoryModalVisible}
        onCancel={() => {
          setCategoryModalVisible(false);
          setEditingCategory(null);
          categoryForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={editingCategory ? handleUpdateCategory : handleCreateCategory}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Category Name"
                rules={[{ required: true, message: 'Please enter category name' }]}
              >
                <Input placeholder="Enter category name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="slug"
                label="Slug"
                rules={[{ required: true, message: 'Please enter slug' }]}
              >
                <Input placeholder="category-slug" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea placeholder="Enter category description" rows={3} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="color"
                label="Color"
                initialValue="#FF7846"
              >
                <Input type="color" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="language"
                label="Language"
                initialValue="en"
              >
                <Select>
                  <Option value="en">English</Option>
                  <Option value="hi">Hindi</Option>
                  <Option value="mr">Marathi</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="active"
              >
                <Select>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                  <Option value="draft">Draft</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="timeLimitMinutes"
                label="Time Limit (minutes)"
                initialValue={15}
              >
                <Input type="number" min={5} max={120} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="questionsPerSession"
                label="Questions per Session"
                initialValue={20}
              >
                <Input type="number" min={5} max={100} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingCategory ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => {
                setCategoryModalVisible(false);
                setEditingCategory(null);
                categoryForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="Import Questions from JSON"
        open={importModalVisible}
        onCancel={() => {
          setImportModalVisible(false);
          importForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Alert
          message="JSON File Format"
          description={
            <div>
              <p>Your JSON file should contain an array of questions with the following fields:</p>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li><strong>category</strong> (optional): Category name - will create new category if doesn't exist</li>
                <li><strong>Question</strong>: The question text</li>
                <li><strong>Options</strong>: Array of options with id and text</li>
                <li><strong>CorrectAnswer</strong>: The correct answer</li>
                <li><strong>Explanation</strong> (optional): Explanation for the answer</li>
                <li><strong>Difficulty</strong> (optional): easy, medium, or hard</li>
                <li><strong>Job</strong> (optional): Array of job categories like ["UPSC", "SSC", "Banking"]</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Form
          form={importForm}
          layout="vertical"
          onFinish={handleImportQuestions}
        >
          <Form.Item
            name="categoryId"
            label="Select Category (Optional)"
            extra="If not selected, categories will be auto-created from the JSON file"
          >
            <Select placeholder="Choose category (optional)" allowClear>
              {categories.map(category => (
                <Option key={category.categoryId} value={category.categoryId}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="file"
            label="JSON File"
            rules={[{ required: true, message: 'Please upload a JSON file' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e && e.fileList;
            }}
          >
            <Upload
              beforeUpload={() => false}
              accept=".json"
              maxCount={1}
              showUploadList={{
                showPreviewIcon: false,
                showRemoveIcon: true,
              }}
            >
              <Button icon={<UploadOutlined />}>Select JSON File</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Import Questions
              </Button>
              <Button onClick={() => {
                setImportModalVisible(false);
                importForm.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
};

export default AdminPage;