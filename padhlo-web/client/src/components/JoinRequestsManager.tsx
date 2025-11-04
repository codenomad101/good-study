import React, { useState, useEffect } from 'react';
import { Card, List, Button, Avatar, message, Spin, Empty, Modal, Input } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { useApi } from '../hooks/useAPI';
import { useAuth } from '../contexts/AuthContext';

const { TextArea } = Input;

interface JoinRequest {
  requestId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    profilePictureUrl?: string;
  };
}

interface JoinRequestsManagerProps {
  groupId: string;
}

const JoinRequestsManager: React.FC<JoinRequestsManagerProps> = ({ groupId }) => {
  const { user } = useAuth();
  const api = useApi();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [groupId]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.client.get(`/community/groups/${groupId}/requests`);
      const requestsData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : (response.data || []);
      // Filter only pending requests
      const pendingRequests = requestsData.filter((r: JoinRequest) => r.status === 'pending');
      setRequests(pendingRequests);
    } catch (error: any) {
      console.error('Error fetching join requests:', error);
      if (error?.response?.status !== 403) {
        message.error('Failed to load join requests');
      }
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await api.client.post(`/community/requests/${requestId}/approve`);
      message.success('Join request approved!');
      fetchRequests();
    } catch (error: any) {
      console.error('Error approving request:', error);
      message.error(error?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    try {
      await api.client.post(`/community/requests/${selectedRequestId}/reject`, {
        rejectionReason: rejectionReason || undefined
      });
      message.success('Join request rejected');
      setRejectModalVisible(false);
      setSelectedRequestId(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      message.error(error?.response?.data?.message || 'Failed to reject request');
    }
  };

  const openRejectModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectModalVisible(true);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card title="Join Requests" size="small">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
        </div>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card title="Join Requests" size="small">
        <Empty description="No pending join requests" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    );
  }

  return (
    <>
      <Card 
        title={`Join Requests (${requests.length})`} 
        size="small"
        style={{ marginBottom: '16px' }}
      >
        <List
          dataSource={requests}
          renderItem={(request) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(request.requestId)}
                  size="small"
                >
                  Approve
                </Button>,
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => openRejectModal(request.requestId)}
                  size="small"
                >
                  Reject
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar>
                    {request.user?.fullName 
                      ? getInitials(request.user.fullName)
                      : <UserOutlined />
                    }
                  </Avatar>
                }
                title={request.user?.fullName || 'Anonymous User'}
                description={
                  <div>
                    <div>{request.user?.email}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      Requested {formatTime(request.requestedAt)}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title="Reject Join Request"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedRequestId(null);
          setRejectionReason('');
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>Are you sure you want to reject this join request?</p>
        </div>
        <TextArea
          placeholder="Rejection reason (optional)"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={3}
        />
      </Modal>
    </>
  );
};

export default JoinRequestsManager;

