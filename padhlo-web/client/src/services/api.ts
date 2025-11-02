import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem('authToken');
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			window.location.href = '/';
		}
		return Promise.reject(error);
	}
);

// Auth API functions
export const authAPI = {
	login: async (credentials: { emailOrUsername: string; password: string }) => {
		const response = await apiClient.post('/auth/login', credentials);
		return response.data;
	},

	register: async (userData: { 
		username?: string;
		email: string; 
		password: string; 
		fullName: string; 
		phone?: string;
		role?: 'admin' | 'student' | 'moderator';
	}) => {
		const response = await apiClient.post('/auth/register', userData);
		return response.data;
	},

	logout: async () => {
		const response = await apiClient.post('/auth/logout');
		return response.data;
	},

	getProfile: async () => {
		const response = await apiClient.get('/auth/profile');
		return response.data.data;
	},

	refreshToken: async () => {
		const response = await apiClient.post('/auth/refresh');
		return response.data;
	},
};

// Practice API functions
export const practiceAPI = {
	// Get practice categories
	getCategories: async () => {
		const response = await apiClient.get('/practice/categories');
		return response.data.data || [];
	},

	// Get topics for a category (slug or id)
	getTopics: async (category: string) => {
		const response = await apiClient.get(`/practice/topics`, { params: { category } });
		return response.data.data || [];
	},

	// Create a new practice session
    createSession: async (category: string, timeLimitMinutes: number = 15, language: 'en' | 'mr' = 'en') => {
        const response = await apiClient.post('/practice/sessions', { 
            category, 
            timeLimitMinutes,
            language
        });
		return response.data;
	},

	// Get practice session by ID
	getSession: async (sessionId: string) => {
		const response = await apiClient.get(`/practice/sessions/${sessionId}`);
		return response.data;
	},

	// Update practice session with answer
	updateAnswer: async (sessionId: string, questionId: string, userAnswer: string, timeSpentSeconds: number) => {
		const response = await apiClient.patch(`/practice/sessions/${sessionId}/answer`, {
			questionId,
			userAnswer,
			timeSpentSeconds
		});
		return response.data;
	},

	// Complete practice session
	completeSession: async (sessionId: string) => {
		const response = await apiClient.patch(`/practice/sessions/${sessionId}/complete`);
		return response.data;
	},

	// Get user's practice history
	getHistory: async () => {
		const response = await apiClient.get('/practice/history');
		return response.data.data || [];
	},

	// Get user's practice statistics
	getStats: async () => {
		const response = await apiClient.get('/practice/stats');
		return response.data.data || {};
	},
};

// Exam API functions
export const examAPI = {
	createDynamicExam: async (examConfig: any) => {
		const response = await apiClient.post('/exam/dynamic/create', examConfig);
		return response.data;
	},

	startExam: async (sessionId: string) => {
		const response = await apiClient.post(`/exam/dynamic/${sessionId}/start`);
		return response.data;
	},

	getQuestions: async (sessionId: string) => {
		const response = await apiClient.get(`/exam/dynamic/${sessionId}/questions`);
		return response.data;
	},

	completeExam: async (sessionId: string, examData: any) => {
		const response = await apiClient.post(`/exam/dynamic/${sessionId}/complete`, examData);
		return response.data;
	},

	getExamHistory: async () => {
		const response = await apiClient.get('/exam/dynamic/history');
		return response.data.data || [];
	},

	getExamStats: async () => {
		const response = await apiClient.get('/exam/dynamic/stats');
		return response.data.data || {};
	},

	resumeExam: async (sessionId: string) => {
		const response = await apiClient.get(`/exam/dynamic/${sessionId}/resume`);
		return response.data.data;
	},
};

// Statistics API functions
export const statisticsAPI = {
	getUserStatistics: async () => {
		const response = await apiClient.get('/statistics/user');
		return response.data.data;
	},

	updatePracticeStatistics: async (data: {
		questionsAttempted: number;
		correctAnswers: number;
		incorrectAnswers: number;
		skippedQuestions: number;
		timeSpentMinutes: number;
	}) => {
		const response = await apiClient.post('/statistics/practice', data);
		return response.data;
	},

	updateExamStatistics: async (data: {
		questionsAttempted: number;
		correctAnswers: number;
		incorrectAnswers: number;
		timeSpentMinutes: number;
	}) => {
		const response = await apiClient.post('/statistics/exam', data);
		return response.data;
	},

	getLeaderboard: async (period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime', category: 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy' = 'overall', subjectId?: string, limit: number = 50) => {
		const params = new URLSearchParams({
			period,
			category,
			limit: limit.toString()
		});
		if (subjectId) {
			params.append('subjectId', subjectId);
		}
		const response = await apiClient.get(`/statistics/leaderboard?${params.toString()}`);
		return response.data.data;
	},

	getUserRank: async (period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime') => {
		const response = await apiClient.get(`/statistics/rank?period=${period}`);
		return response.data.data;
	},

	getAvailableSubjects: async () => {
		const response = await apiClient.get('/statistics/subjects');
		return response.data.data;
	},
};

// Study API
export const studyAPI = {
  getMaterials: async (category: string, topic?: string, language: string = 'en', page: number = 1, pageSize: number = 10) => {
    const response = await apiClient.get('/study/materials', { params: { category, topic, language, page, pageSize } });
    return response.data.data as { items: any[]; total: number };
  },
};

// Notes API (Personal Notes like Google Keep)
export const notesAPI = {
  getNotes: async (params?: { archived?: string; pinned?: string; category?: string; search?: string }) => {
    const response = await apiClient.get('/notes', { params });
    return response.data.data;
  },
  
  getNoteById: async (noteId: string) => {
    const response = await apiClient.get(`/notes/${noteId}`);
    return response.data.data;
  },
  
  createNote: async (note: { title: string; content: string; color?: string; categoryId?: string; categorySlug?: string; topicSlug?: string; tags?: string[]; isPinned?: boolean; isArchived?: boolean }) => {
    const response = await apiClient.post('/notes', note);
    return response.data.data;
  },
  
  updateNote: async (noteId: string, note: Partial<{ title: string; content: string; color: string; categoryId: string; categorySlug: string; topicSlug: string; tags: string[]; isPinned: boolean; isArchived: boolean }>) => {
    const response = await apiClient.put(`/notes/${noteId}`, note);
    return response.data.data;
  },
  
  deleteNote: async (noteId: string) => {
    const response = await apiClient.delete(`/notes/${noteId}`);
    return response.data;
  },
};

// User API functions
export const userAPI = {
	getProfile: async () => {
		const response = await apiClient.get('/user/profile');
		return response.data;
	},

	updateProfile: async (userData: any) => {
		const response = await apiClient.put('/user/profile', userData);
		return response.data;
	},

	changePassword: async (passwordData: { currentPassword: string; newPassword: string }) => {
		const response = await apiClient.put('/user/change-password', passwordData);
		return response.data;
	},

	getProgress: async () => {
		const response = await apiClient.get('/progress/user');
		return response.data;
	},
};

// Admin API functions
export const adminAPI = {
	// Dashboard
	getDashboardStats: async () => {
		const response = await apiClient.get('/admin/dashboard/stats');
		return response.data;
	},

	// Category Management
	createCategory: async (categoryData: any) => {
		const response = await apiClient.post('/admin/categories', categoryData);
		return response.data;
	},

	getCategories: async (params?: any) => {
		const response = await apiClient.get('/admin/categories', { params });
		return response.data;
	},

	updateCategory: async (categoryId: string, categoryData: any) => {
		const response = await apiClient.put(`/admin/categories/${categoryId}`, categoryData);
		return response.data;
	},

	deleteCategory: async (categoryId: string) => {
		const response = await apiClient.delete(`/admin/categories/${categoryId}`);
		return response.data;
	},

	// Question Management
	getQuestions: async (params?: any) => {
		const response = await apiClient.get('/admin/questions', { params });
		return response.data;
	},

	deleteQuestion: async (questionId: string) => {
		const response = await apiClient.delete(`/admin/questions/${questionId}`);
		return response.data;
	},

	// JSON Import
	importQuestions: async (categoryId: string, file: File) => {
		const formData = new FormData();
		formData.append('jsonFile', file);
		formData.append('categoryId', categoryId);
		
		const response = await apiClient.post('/admin/import/questions', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data;
	},

	getImportLogs: async (params?: any) => {
		const response = await apiClient.get('/admin/import/logs', { params });
		return response.data;
	},

	// User Management
	getUsers: async (params?: any) => {
		const response = await apiClient.get('/admin/users', { params });
		return response.data;
	},

	updateUser: async (userId: string, userData: any) => {
		const response = await apiClient.put(`/admin/users/${userId}`, userData);
		return response.data;
	},
};

// Jobs API
export const jobsAPI = {
	getJobs: async (params?: { status?: string; isActive?: boolean }) => {
		const response = await apiClient.get('/jobs', { params });
		return response.data.data || [];
	},

	getJobById: async (jobId: string) => {
		const response = await apiClient.get(`/jobs/${jobId}`);
		return response.data.data;
	},

	getJobByShortCode: async (shortCode: string) => {
		const response = await apiClient.get(`/jobs/short-code/${shortCode}`);
		return response.data.data;
	},

	getJobsWithStats: async () => {
		const response = await apiClient.get('/jobs/stats');
		return response.data.data || [];
	},

	createJob: async (jobData: any) => {
		const response = await apiClient.post('/jobs', jobData);
		return response.data;
	},

	updateJob: async (jobId: string, jobData: any) => {
		const response = await apiClient.put(`/jobs/${jobId}`, jobData);
		return response.data;
	},

	deleteJob: async (jobId: string) => {
		const response = await apiClient.delete(`/jobs/${jobId}`);
		return response.data;
	},
};
