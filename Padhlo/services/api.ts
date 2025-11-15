import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@/config/api';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      if (__DEV__) {
        console.error('Error getting auth token:', error);
      }
      return null;
    }
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      if (__DEV__) {
        console.log('[API] Auth token found, adding to headers');
      }
    } else {
      if (__DEV__) {
        console.warn('[API] No auth token found! Request may fail with 403');
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // Extract endpoint from URL for better error messages
    const url = response.url;
    let endpoint = url ? url.replace(this.baseURL, '') || url : 'unknown';
    
    try {
      if (__DEV__) {
        console.log('[API] handleResponse called:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: url,
          endpoint: endpoint
        });
      }
      
      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      let data: any;
      
      // Check if response is successful (2xx status codes)
      const isSuccess = response.status >= 200 && response.status < 300;
      
      // Read response body once (can only be read once)
      // IMPORTANT: In React Native, we need to read the response carefully
      // The response stream can only be consumed once
      let responseText = '';
      try {
        // Read the response text - this consumes the stream
        // Wrap in Promise.resolve to ensure proper async handling
        responseText = await Promise.resolve(response.text());
        if (__DEV__) {
          console.log('[API] Response text length:', responseText.length);
          if (responseText.length > 0) {
            console.log('[API] Response text (first 300 chars):', responseText.substring(0, 300));
          } else {
            console.log('[API] Response body is empty');
          }
        }
      } catch (readError: any) {
        if (__DEV__) {
          console.error('[API] Error reading response body:', {
            endpoint: endpoint,
            url: url,
            error: readError,
            errorName: readError?.name,
            errorMessage: readError?.message,
            status: response.status,
            statusText: response.statusText,
            isSuccess: isSuccess
          });
        }
        // If it's a successful response with no body (like 204 No Content), that's okay
        if (isSuccess && (response.status === 204 || contentLength === '0')) {
          return { success: true } as ApiResponse<T>;
        }
        // Re-throw with endpoint context
        const enhancedError = new Error(
          `Error reading response from ${endpoint}: ${readError?.message || 'Unknown error'}`
        );
        (enhancedError as any).originalError = readError;
        (enhancedError as any).endpoint = endpoint;
        throw enhancedError;
      } finally {
        // Ensure response is fully consumed - no additional reads
        // This helps prevent React Native fetch issues
      }
      
      // Parse JSON if we have content
      if (responseText && responseText.length > 0) {
        if (contentType && contentType.includes('application/json')) {
          try {
            data = JSON.parse(responseText);
          } catch (parseError: any) {
            if (__DEV__) {
              console.error('[API] JSON parse error:', parseError);
              console.error('[API] Full response text:', responseText);
            }
            throw new Error(`Invalid JSON response: ${parseError?.message || 'Parse error'}`);
          }
        } else {
          // If not JSON, try to parse as JSON anyway (some servers don't set content-type correctly)
          try {
            data = JSON.parse(responseText);
          } catch {
            // If it's not JSON and not a success response, return as text error
            if (!isSuccess) {
              throw new Error(responseText || `HTTP error! status: ${response.status}`);
            }
            // For success responses with non-JSON, return the text
            data = { success: true, data: responseText };
          }
        }
      } else if (isSuccess) {
        // Empty successful response
        data = { success: true };
      }
      
      // Check for error status codes
      if (!isSuccess) {
        if (__DEV__) {
          console.error('[API] Non-success status code:', response.status);
          // Log detailed error information for debugging
          const errorInfo = {
            url: response.url,
            status: response.status,
            statusText: response.statusText,
            data: data,
            message: data?.message,
            error: data?.error,
            errors: data?.errors,
            success: data?.success
          };
          console.error(`[API] Error response (${response.status}):`, errorInfo);
          
          // For 400 errors, provide more context
          if (response.status === 400) {
            console.error('[API] Bad Request Details:', {
              requestUrl: response.url,
              errorMessage: data?.message,
              validationErrors: data?.validationErrors,
              errorData: data,
              hint: 'Check if the request body matches server expectations'
            });
          }
        }
          
        // If there are validation errors, include them in the error message
        if (data?.validationErrors && Array.isArray(data.validationErrors)) {
          const validationMsg = data.validationErrors
            .map((err: any) => `${err.path?.join('.') || 'field'}: ${err.message}`)
            .join(', ');
          throw new Error(`${data?.message || 'Validation failed'}: ${validationMsg}`);
        }
        
        // Create error with additional context for subscription errors
        const error = new Error(data?.message || data?.error || `HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        (error as any).requiresUpgrade = data?.requiresUpgrade || false;
        (error as any).currentPlan = data?.currentPlan;
        (error as any).availablePlans = data?.availablePlans;
        throw error;
      }

      if (__DEV__) {
        console.log('[API] Response parsed successfully:', {
          success: data?.success,
          hasData: !!data?.data,
          isDataArray: Array.isArray(data?.data),
          dataType: typeof data?.data,
          message: data?.message,
          status: response.status,
          hasGroupId: !!(data as any)?.groupId,
          hasPostId: !!(data as any)?.postId,
          isArray: Array.isArray(data)
        });
      }
      
      // Handle different response structures:
      // 1. Backend returns { success: true, data: ... } - use as is
      // 2. Backend returns array directly [ ... ] - wrap it
      // 3. Backend returns object directly { groupId, name, ... } - wrap it
      let result: ApiResponse<T>;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Check if it's already in ApiResponse format
        if ('success' in data && 'data' in data) {
          result = data as ApiResponse<T>;
        } else {
          // It's a direct object response (like group, post, etc.)
          // Wrap it in ApiResponse format
          result = {
            success: true,
            data: data as T
          } as ApiResponse<T>;
        }
      } else if (Array.isArray(data)) {
        // Backend returned array directly
        result = {
          success: true,
          data: data as T
        } as ApiResponse<T>;
      } else {
        // Fallback: try to use as ApiResponse
        result = data as ApiResponse<T>;
      }
      
      if (__DEV__) {
        console.log('[API] Returning result:', {
          hasSuccess: 'success' in result,
          hasData: 'data' in result,
          dataType: typeof result.data,
          isDataArray: Array.isArray(result.data)
        });
      }
      
      // Ensure we return a plain object, not wrapped in any Response-related objects
      // This deep clone prevents any references to the response object that might cause issues
      const cleanResult = JSON.parse(JSON.stringify(result)) as ApiResponse<T>;
      
      return cleanResult;
    } catch (error: any) {
      const endpointFromError = error?.endpoint || endpoint || 'unknown';
      if (__DEV__) {
        console.error('[API] handleResponse error:', {
          endpoint: endpointFromError,
          url: url,
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
          originalError: error?.originalError
        });
      }
      
      // Improve error messages for network failures
      let errorMessage = error?.message || 'Unknown error occurred';
      if (errorMessage.includes('Network request failed') && !errorMessage.includes(endpointFromError)) {
        errorMessage = `Network error while processing response from ${endpointFromError}. Please check if the server is running and accessible.`;
      } else if (!errorMessage.includes(endpointFromError)) {
        errorMessage = `Error processing response from ${endpointFromError}: ${errorMessage}`;
      }
      
      const enhancedError = new Error(errorMessage);
      (enhancedError as any).originalError = error;
      (enhancedError as any).endpoint = endpointFromError;
      throw enhancedError;
    }
  }

  // Generic HTTP methods with timeout
  // Increased timeout for initial connection attempts
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number = 30000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Log request details for debugging
    if (__DEV__) {
      console.log('[API] Fetch request:', {
        url,
        method: options.method,
        hasBody: !!options.body,
        bodySize: options.body ? JSON.stringify(options.body).length : 0
      });
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (__DEV__) {
        console.log('[API] Fetch response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
      }
      
      // Clone the response so we can inspect it without consuming it
      // (handleResponse will consume it)
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (__DEV__) {
        console.error('[API] Fetch error:', {
          url,
          errorName: error.name,
          errorMessage: error.message,
          networkError: error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')
        });
      }
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms. Please check your network connection.`);
      }
      if (error.message?.includes('Network request failed') || error.message?.includes('Failed to fetch')) {
        throw new Error(`Network request failed. Check: 1) Server running at ${url.replace('/api', '')}/health, 2) Correct IP address, 3) Same network`);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error(`GET ${endpoint} failed:`, error);
      }
      if (error.message === 'Request timeout') {
        throw new Error('Request timed out. Please check your network connection.');
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please ensure the server is running and accessible.');
      }
      throw error;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const fullUrl = `${this.baseURL}${endpoint}`;
      
      // Debug logging
      if (__DEV__) {
        console.log('[API] POST Request Details:', {
          baseURL: this.baseURL,
          endpoint: endpoint,
          fullUrl: fullUrl,
          hasData: !!data,
          hasAuth: !!headers['Authorization']
        });
      }
      
      let response: Response;
      try {
        response = await this.fetchWithTimeout(fullUrl, {
          method: 'POST',
          headers,
          body: data ? JSON.stringify(data) : undefined,
        });
      } catch (fetchError: any) {
        if (__DEV__) {
          console.error('[API] Fetch failed before response:', {
            endpoint,
            error: fetchError,
            errorMessage: fetchError?.message,
            errorName: fetchError?.name
          });
        }
        throw fetchError;
      }

      // Handle response immediately - don't let it hang
      // Wrap in try-catch to handle any response reading errors
      try {
        const result = await this.handleResponse<T>(response);
        if (__DEV__) {
          console.log('[API] POST completed successfully for:', endpoint);
        }
        // Explicitly mark response as consumed to prevent any cleanup issues
        return result;
      } catch (handleError: any) {
        if (__DEV__) {
          console.error('[API] Error in handleResponse for POST:', {
            endpoint,
            error: handleError,
            errorMessage: handleError?.message,
            errorName: handleError?.name,
            responseStatus: response.status,
            responseOk: response.ok
          });
          // If we got a successful HTTP status but error in parsing, log it differently
          if (response.ok || (response.status >= 200 && response.status < 300)) {
            console.warn('[API] Warning: Got successful HTTP status but error in response handling for:', endpoint);
          }
        }
        // Include endpoint in error message for better debugging
        if (handleError.message && !handleError.message.includes(endpoint)) {
          handleError.message = `Error processing response from ${endpoint}: ${handleError.message}`;
        }
        throw handleError;
      }
    } catch (error: any) {
      const url = `${this.baseURL}${endpoint}`;
      if (__DEV__) {
        console.error(`[API] POST ${endpoint} failed:`, {
          errorName: error?.name,
          errorMessage: error?.message,
          fullUrl: url,
          baseURL: this.baseURL,
          endpoint: endpoint,
          stack: error?.stack
        });
      }
      
      // Create a more informative error message that includes the endpoint
      let errorMessage = error?.message || 'Unknown error occurred';
      
      if (error.name === 'AbortError' || errorMessage === 'Request timeout' || errorMessage.includes('timeout')) {
        errorMessage = `Request to ${endpoint} timed out. Please check your network connection.`;
      } else if (errorMessage.includes('Network request failed') || errorMessage.includes('Failed to fetch')) {
        errorMessage = `Network error while calling ${endpoint}. Please check: 1) Server is running, 2) Correct IP/URL, 3) Network connectivity`;
      } else if (!errorMessage.includes(endpoint)) {
        // Ensure endpoint is in error message for better debugging
        errorMessage = `Error calling ${endpoint}: ${errorMessage}`;
      }
      
      const apiError = new Error(errorMessage);
      (apiError as any).originalError = error;
      (apiError as any).endpoint = endpoint;
      throw apiError;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error(`PUT ${endpoint} failed:`, error);
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please ensure the server is running and accessible.');
      }
      throw error;
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error(`PATCH ${endpoint} failed:`, error);
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please ensure the server is running and accessible.');
      }
      throw error;
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await this.fetchWithTimeout(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error(`DELETE ${endpoint} failed:`, error);
      }
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error('Cannot connect to server. Please ensure the server is running and accessible.');
      }
      throw error;
    }
  }

  // Auth methods
  async login(emailOrUsername: string, password: string) {
    return this.post('/auth/login', { emailOrUsername, password });
  }

  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
  }) {
    return this.post('/auth/register', userData);
  }

  async verifyToken() {
    return this.get('/auth/verify');
  }

  async updateProfile(profileData: {
    fullName?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    profilePictureUrl?: string;
  }) {
    return this.put('/auth/profile', profileData);
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.put('/auth/change-password', passwordData);
  }

  // User methods
  async getUserProfile() {
    return this.get('/user/profile');
  }

  // Available Exams methods (system-wide, visible to all)
  async getAvailableExams(params?: { upcoming?: string }): Promise<ApiResponse<any[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.upcoming) {
        queryParams.append('upcoming', params.upcoming);
      }
      const url = `${this.baseURL}/available-exams${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      if (__DEV__) {
        console.log('[API] Fetching available exams from:', url);
      }
      
      // This is a public endpoint, so we don't need auth headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (__DEV__) {
        console.log('[API] Available exams response status:', response.status);
      }
      const result = await this.handleResponse<any[]>(response);
      if (__DEV__) {
        console.log('[API] Available exams result:', {
          success: result.success,
          dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
          data: result.data
        });
      }
      return result;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error fetching available exams:', error);
      }
      // Return empty array on error so UI doesn't break
      return {
        success: false,
        data: [],
        message: error?.message || 'Failed to fetch available exams'
      };
    }
  }

  async createAvailableExam(exam: {
    examName: string;
    examDate: string;
    examTime?: string;
    description?: string;
    sortOrder?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/available-exams`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(exam),
      });
      return await this.handleResponse<any>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error creating available exam:', error);
      }
      throw error;
    }
  }

  async updateAvailableExam(examId: string, exam: {
    examName?: string;
    examDate?: string;
    examTime?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseURL}/available-exams/${examId}`, {
        method: 'PUT',
        headers: await this.getHeaders(),
        body: JSON.stringify(exam),
      });
      return await this.handleResponse<any>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error updating available exam:', error);
      }
      throw error;
    }
  }

  async deleteAvailableExam(examId: string): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseURL}/available-exams/${examId}`, {
        method: 'DELETE',
        headers: await this.getHeaders(),
      });
      return await this.handleResponse<void>(response);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error deleting available exam:', error);
      }
      throw error;
    }
  }

  // Exam methods
  async getAllExams() {
    return this.get('/exam/exams');
  }

  async getExamById(examId: string) {
    return this.get(`/exam/exams/${examId}`);
  }

  async getExamStructure(examId: string) {
    return this.get(`/exam/exams/${examId}/structure`);
  }

  async getSubjectsByExam(examId: string) {
    return this.get(`/exam/exams/${examId}/subjects`);
  }

  async getTopicsBySubject(subjectId: string) {
    return this.get(`/exam/subjects/${subjectId}/topics`);
  }

  async getQuestionsByTopic(topicId: string, limit: number = 50, offset: number = 0) {
    return this.get(`/exam/topics/${topicId}/questions?limit=${limit}&offset=${offset}`);
  }

  async getQuestionsBySubject(subjectId: string, limit: number = 50, offset: number = 0) {
    return this.get(`/exam/subjects/${subjectId}/questions?limit=${limit}&offset=${offset}`);
  }

  async getUserExamPreferences() {
    return this.get('/exam/user/preferences');
  }

  async setUserExamPreference(preferenceData: {
    examId: string;
    targetExamDate?: string;
    dailyStudyGoalMinutes?: number;
    isPrimaryExam?: boolean;
  }) {
    return this.post('/exam/user/preferences', preferenceData);
  }

  // Progress methods
  async getUserProgress(subjectId?: string) {
    const endpoint = subjectId ? `/progress/progress?subjectId=${subjectId}` : '/progress/progress';
    return this.get(endpoint);
  }

  async getTopicProgress(topicId: string) {
    return this.get(`/progress/progress/topic/${topicId}`);
  }

  async updateProgress(progressData: {
    topicId: string;
    subjectId: string;
    totalQuestionsAttempted?: number;
    correctAnswers?: number;
    totalTimeSpentSeconds?: number;
    masteryLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    masteryPercentage?: number;
    averageAccuracy?: number;
    averageTimePerQuestionSeconds?: number;
    needsRevision?: boolean;
  }) {
    return this.put('/progress/progress', progressData);
  }

  async getUserStats(days: number = 30) {
    return this.get(`/progress/stats?days=${days}`);
  }

  async getSubjectWiseProgress() {
    return this.get('/progress/stats/subject-wise');
  }

  async getWeakTopics(limit: number = 10) {
    return this.get(`/progress/stats/weak-topics?limit=${limit}`);
  }

  // Note: This method is for the progress API, not practice sessions
  // Use createPracticeSession from practice API instead
  async createProgressPracticeSession(sessionData: {
    topicId: string;
    subjectId: string;
    sessionDate: string;
    sessionType?: 'daily' | 'custom' | 'revision';
    totalQuestions?: number;
    questionsAttempted?: number;
    correctAnswers?: number;
    timeSpentSeconds?: number;
    accuracyPercentage?: number;
    pointsEarned?: number;
    isCompleted?: boolean;
  }) {
    return this.post('/progress/practice-sessions', sessionData);
  }

  async addQuestionHistory(historyData: {
    questionId: string;
    userAnswer?: string;
    isCorrect?: boolean;
    timeTakenSeconds?: number;
    attemptNumber?: number;
    sourceType?: 'daily_practice' | 'test' | 'revision' | 'custom_practice';
    sourceId?: string;
  }) {
    return this.post('/progress/question-history', historyData);
  }

  // Test methods
  async getAllTestTemplates(examId?: string) {
    const endpoint = examId ? `/test/templates?examId=${examId}` : '/test/templates';
    return this.get(endpoint);
  }

  async getTestTemplateById(templateId: string) {
    return this.get(`/test/templates/${templateId}`);
  }

  async createUserTest(templateId: string) {
    return this.post('/test/user-tests', { templateId });
  }

  async getUserTests(status?: string) {
    const endpoint = status ? `/test/user-tests?status=${status}` : '/test/user-tests';
    return this.get(endpoint);
  }

  async getUserTestById(userTestId: string) {
    return this.get(`/test/user-tests/${userTestId}`);
  }

  async startUserTest(userTestId: string) {
    return this.put(`/test/user-tests/${userTestId}/start`);
  }

  async completeUserTest(userTestId: string, testData: {
    timeTakenSeconds: number;
    totalQuestionsAttempted: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    marksObtained: number;
    percentage: number;
    rank?: number;
    totalParticipants?: number;
    percentile?: number;
  }) {
    return this.put(`/test/user-tests/${userTestId}/complete`, testData);
  }

  async submitTestResponse(responseData: {
    userTestId: string;
    questionId: string;
    userAnswer?: string;
    isCorrect?: boolean;
    timeTakenSeconds?: number;
    isMarkedForReview?: boolean;
    responseOrder?: number;
    marksObtained?: number;
  }) {
    return this.post('/test/responses', responseData);
  }

  async getUserTestResponses(userTestId: string) {
    return this.get(`/test/user-tests/${userTestId}/responses`);
  }

  async generateTestQuestions(templateId: string, examId: string, subjectIds?: string[]) {
    return this.post('/test/generate-questions', {
      templateId,
      examId,
      subjectIds,
    });
  }

  async getUserTestAnalytics(days: number = 30) {
    return this.get(`/test/analytics?days=${days}`);
  }

  async getUserDailyPracticeSessions(days: number = 7) {
    // Calculate start and end dates based on days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return this.get(`/progress/practice-sessions?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTestLeaderboard(templateId: string, limit: number = 100) {
    return this.get(`/test/templates/${templateId}/leaderboard?limit=${limit}`);
  }

  async getUserRankInTest(userTestId: string) {
    return this.get(`/test/user-tests/${userTestId}/rank`);
  }

  // Practice API methods (enhanced practice)
  async getPracticeCategories() {
    const response = await this.get<any>('/practice/categories');
    // API returns: { success: true, data: [...] }
    // Extract the data array properly
    if (response.success && response.data) {
      return { ...response, data: Array.isArray(response.data) ? response.data : [] };
    }
    // Fallback for nested data
    return { ...response, data: (response.data as any)?.data || [] };
  }

  async getPracticeTopics(category: string) {
    const response = await this.get<any>(`/practice/topics?category=${category}`);
    return { ...response, data: (response.data as any)?.data || [] };
  }

  async createPracticeSession(category: string, timeLimitMinutes: number = 15, language: 'en' | 'mr' = 'en') {
    return this.post('/practice/sessions', { 
      category, 
      timeLimitMinutes,
      language
    });
  }

  async getPracticeSession(sessionId: string) {
    return this.get(`/practice/sessions/${sessionId}`);
  }

  async updatePracticeAnswer(sessionId: string, questionId: string, userAnswer: string, timeSpentSeconds: number) {
    return this.patch(`/practice/sessions/${sessionId}/answer`, {
      questionId,
      userAnswer,
      timeSpentSeconds
    });
  }

  async completePracticeSession(sessionId: string, timeSpentSeconds?: number) {
    return this.patch(`/practice/sessions/${sessionId}/complete`, {
      ...(timeSpentSeconds !== undefined && { timeSpentSeconds })
    });
  }

  async getPracticeHistory() {
    const response = await this.get('/practice/history');
    return { ...response, data: (response.data as any)?.data || [] };
  }

  async getPracticeStats() {
    const response = await this.get('/practice/stats');
    return { ...response, data: (response.data as any)?.data || {} };
  }

  // Dynamic Exam API methods
  async createDynamicExam(examConfig: any) {
    console.log('[API] Creating dynamic exam with config:', JSON.stringify(examConfig, null, 2));
    console.log('[API] Endpoint: /exam/dynamic/create');
    console.log('[API] Full URL will be:', `${this.baseURL}/exam/dynamic/create`);
    return this.post('/exam/dynamic/create', examConfig);
  }

  async startDynamicExam(sessionId: string) {
    return this.post(`/exam/dynamic/${sessionId}/start`);
  }

  async getDynamicExamQuestions(sessionId: string) {
    return this.get(`/exam/dynamic/${sessionId}/questions`);
  }

  async completeDynamicExam(sessionId: string, examData: any) {
    return this.post(`/exam/dynamic/${sessionId}/complete`, examData);
  }

  async getDynamicExamHistory() {
    const response = await this.get('/exam/dynamic/history');
    // response is { success: true, data: [...] } where data is already the array
    // So we just return the response as-is, or extract the data array
    return { ...response, data: Array.isArray(response.data) ? response.data : [] };
  }

  async getDynamicExamStats() {
    const response = await this.get('/exam/dynamic/stats');
    return { ...response, data: (response.data as any)?.data || {} };
  }

  async resumeDynamicExam(sessionId: string) {
    const response = await this.get(`/exam/dynamic/${sessionId}/resume`);
    return { ...response, data: (response.data as any)?.data };
  }

  // Notifications API methods
  async getNotifications() {
    const response = await this.get('/notifications');
    // Response structure: { success: true, data: { notifications: [...], unreadCount: number } }
    return response;
  }

  async getUnreadCount() {
    const response = await this.get('/notifications/unread-count');
    return response;
  }

  async markNotificationAsRead(notificationId: string) {
    return this.put(`/notifications/${notificationId}/read`, {});
  }

  async markAllNotificationsAsRead() {
    return this.put('/notifications/read-all', {});
  }

  async deleteNotification(notificationId: string) {
    return this.delete(`/notifications/${notificationId}`);
  }

  // Statistics API methods
 async getUserStatistics() {
  const response = await this.get('/statistics/user');
  // Handle different response structures
  // API might return: { success: true, data: {...} } or just {...}
  if (response && typeof response === 'object') {
    if ('data' in response && response.data) {
      return response.data;
    }
    if ('success' in response && response.success && 'data' in response) {
      return response.data;
    }
    // If response is already the data object, return it
    return response;
  }
  return response;
}

  async getLeaderboard(
    period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime', 
    category: 'overall' | 'practice' | 'exam' | 'streak' | 'accuracy' = 'overall', 
    subjectId?: string, 
    limit: number = 50
  ) {
    const params = new URLSearchParams({
      period,
      category,
      limit: limit.toString()
    });
    if (subjectId) {
      params.append('subjectId', subjectId);
    }
    const response = await this.get(`/statistics/leaderboard?${params.toString()}`);
    // Response structure: { success: true, data: [...], message: "..." }
    // So response.data is already the array, not { data: [...] }
    return { ...response, data: Array.isArray(response.data) ? response.data : (response.data as any)?.data || [] };
  }

  async getUserRank(period: 'daily' | 'weekly' | 'monthly' | 'alltime' = 'alltime') {
    const response = await this.get(`/statistics/rank?period=${period}`);
    // Response structure: { success: true, data: { rank: 1 }, message: "..." }
    // So response.data is already { rank: 1 }, not { data: { rank: 1 } }
    return { ...response, data: response.data };
  }

  async getAvailableSubjects() {
    const response = await this.get('/statistics/subjects');
    return { ...response, data: (response.data as any)?.data };
  }

  // Study API methods
  async getStudyMaterials(
    category: string, 
    topic?: string, 
    language: string = 'en', 
    page: number = 1, 
    pageSize: number = 10
  ) {
    const params = new URLSearchParams({
      category,
      language,
      page: page.toString(),
      pageSize: pageSize.toString()
    });
    if (topic) {
      params.append('topic', topic);
    }
    const response = await this.get(`/study/materials?${params.toString()}`);
    return { ...response, data: (response.data as any)?.data };
  }

  // Notes API methods
  async getNotes(params?: { archived?: string; pinned?: string; category?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.archived) queryParams.append('archived', params.archived);
    if (params?.pinned) queryParams.append('pinned', params.pinned);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const response = await this.get(`/notes${queryString ? `?${queryString}` : ''}`);
    if (__DEV__) {
      console.log('[API] getNotes raw response:', JSON.stringify(response, null, 2));
    }
    // Backend returns { success: true, data: [...] }
    return response;
  }

  async getNoteById(noteId: string) {
    const response = await this.get(`/notes/${noteId}`);
    return { ...response, data: (response.data as any)?.data };
  }

  async createNote(note: { 
    title: string; 
    content: string; 
    color?: string; 
    categoryId?: string; 
    categorySlug?: string; 
    topicSlug?: string; 
    tags?: string[]; 
    attachments?: Array<{ url: string; type: string; filename?: string }>;
    isPinned?: boolean; 
    isArchived?: boolean 
  }) {
    const response = await this.post('/notes', note);
    return { ...response, data: (response.data as any)?.data };
  }

  async updateNote(
    noteId: string, 
    note: Partial<{ 
      title: string; 
      content: string; 
      color: string; 
      categoryId: string; 
      categorySlug: string; 
      topicSlug: string; 
      tags: string[]; 
      attachments: Array<{ url: string; type: string; filename?: string }>;
      isPinned: boolean; 
      isArchived: boolean 
    }>
  ) {
    const response = await this.put(`/notes/${noteId}`, note);
    return { ...response, data: (response.data as any)?.data };
  }

  async deleteNote(noteId: string) {
    return this.delete(`/notes/${noteId}`);
  }

  // Calendar/Reminders API
  async getReminders(params?: { upcoming?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.upcoming) queryParams.append('upcoming', params.upcoming);
    const queryString = queryParams.toString();
    return this.get(`/calendar${queryString ? `?${queryString}` : ''}`);
  }

  async getReminderById(reminderId: string) {
    return this.get(`/calendar/${reminderId}`);
  }

  async createReminder(reminder: {
    examName: string;
    examDate: string; // YYYY-MM-DD
    examTime?: string; // HH:MM
    description?: string;
    reminderBeforeDays?: number;
    reminderEnabled?: boolean;
  }) {
    return this.post('/calendar', reminder);
  }

  async updateReminder(reminderId: string, reminder: Partial<{
    examName: string;
    examDate: string;
    examTime: string;
    description: string;
    reminderBeforeDays: number;
    reminderEnabled: boolean;
  }>) {
    return this.put(`/calendar/${reminderId}`, reminder);
  }

  async deleteReminder(reminderId: string) {
    return this.delete(`/calendar/${reminderId}`);
  }

  // Schedule API
  async getSchedules(params?: { active?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.active) queryParams.append('active', params.active);
    const queryString = queryParams.toString();
    return this.get(`/schedule${queryString ? `?${queryString}` : ''}`);
  }

  async getScheduleById(scheduleId: string) {
    return this.get(`/schedule/${scheduleId}`);
  }

  async createSchedule(schedule: {
    subjectName: string;
    durationMinutes: number;
    preferredTime?: string; // HH:MM
    isActive?: boolean;
  }) {
    return this.post('/schedule', schedule);
  }

  async updateSchedule(scheduleId: string, schedule: Partial<{
    subjectName: string;
    durationMinutes: number;
    preferredTime: string;
    isActive: boolean;
  }>) {
    return this.put(`/schedule/${scheduleId}`, schedule);
  }

  async deleteSchedule(scheduleId: string) {
    return this.delete(`/schedule/${scheduleId}`);
  }

  async getStudyLogs(params?: { subject?: string; startDate?: string; endDate?: string; limit?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit);
    const queryString = queryParams.toString();
    return this.get(`/schedule/logs${queryString ? `?${queryString}` : ''}`);
  }

  async logStudySession(session: {
    scheduleId?: string;
    subjectName: string;
    durationMinutes: number;
    completed?: boolean;
    notes?: string;
  }) {
    return this.post('/schedule/logs', session);
  }

  async uploadNoteAttachment(fileUri: string, filename: string, mimeType: string): Promise<ApiResponse<{ url: string; type: string; filename: string; size: number }>> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // In React Native, we need to append the file differently
      // @ts-ignore - React Native FormData supports file objects
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: filename || 'attachment',
      } as any);

      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/notes/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type for FormData - let fetch set it with boundary
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload attachment');
      }

      // Return the response in the expected format
      if (data && typeof data === 'object') {
        if ('success' in data && 'data' in data) {
          return data as ApiResponse<{ url: string; type: string; filename: string; size: number }>;
        } else {
          return {
            success: true,
            data: data as { url: string; type: string; filename: string; size: number }
          } as ApiResponse<{ url: string; type: string; filename: string; size: number }>;
        }
      }

      return {
        success: true,
        data: data as { url: string; type: string; filename: string; size: number }
      } as ApiResponse<{ url: string; type: string; filename: string; size: number }>;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error uploading attachment:', error);
      }
      throw error;
    }
  }

  // Upload profile picture
  async uploadProfilePicture(fileUri: string, filename: string, mimeType: string): Promise<ApiResponse<{ url: string; user: any }>> {
    try {
      const formData = new FormData();
      
      // @ts-ignore - React Native FormData supports file objects
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: filename || 'profile.jpg',
      } as any);

      const token = await this.getAuthToken();
      const response = await fetch(`${this.baseURL}/auth/upload-profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload profile picture');
      }

      return data as ApiResponse<{ url: string; user: any }>;
    } catch (error: any) {
      if (__DEV__) {
        console.error('[API] Error uploading profile picture:', error);
      }
      throw error;
    }
  }

  // Logout method
  async logout() {
    return this.post('/auth/logout');
  }

  // Community API methods
  async getGroups() {
    // Backend returns array directly, so we need to handle it properly
    const response = await this.get('/community/groups');
    // The backend returns an array directly, but our handleResponse wraps it
    // So response.data might be the array, or it might be wrapped
    return response;
  }

  async getGroup(groupId: string) {
    return this.get(`/community/groups/${groupId}`);
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    examType?: string;
    subjectId?: string;
    isPublic?: boolean;
  }) {
    return this.post('/community/groups', groupData);
  }

  async joinGroup(groupId: string) {
    return this.post(`/community/groups/${groupId}/join`);
  }

  async requestToJoinGroup(groupId: string) {
    return this.post(`/community/groups/${groupId}/request`);
  }

  async getGroupMembers(groupId: string) {
    // Backend returns array directly
    const response = await this.get(`/community/groups/${groupId}/members`);
    return response;
  }

  async getGroupPosts(groupId: string) {
    // Backend returns array directly, sorted by createdAt descending
    const response = await this.get(`/community/groups/${groupId}/posts`);
    return response;
  }

  async createPost(groupId: string, postContent: string) {
    return this.post(`/community/groups/${groupId}/posts`, { postContent });
  }

  async getPost(postId: string) {
    // Backend returns single post object
    return this.get(`/community/posts/${postId}`);
  }

  async getPostComments(postId: string) {
    // Backend returns array directly, sorted by createdAt ascending
    const response = await this.get(`/community/posts/${postId}/comments`);
    return response;
  }

  async createComment(postId: string, commentContent: string) {
    return this.post(`/community/posts/${postId}/comments`, { commentContent });
  }

  async getJoinRequests(groupId: string) {
    const response = await this.get(`/community/groups/${groupId}/requests`);
    return { ...response, data: Array.isArray(response.data?.data) ? response.data.data : [] };
  }

  async approveJoinRequest(requestId: string) {
    return this.post(`/community/requests/${requestId}/approve`);
  }

  async rejectJoinRequest(requestId: string, rejectionReason?: string) {
    return this.post(`/community/requests/${requestId}/reject`, { rejectionReason });
  }

  // Subscription API methods
  async getSubscriptionStatus() {
    return this.get('/subscription/status');
  }

  async startTrial() {
    return this.post('/subscription/trial');
  }

  async subscribeToLite() {
    return this.post('/subscription/lite');
  }

  async subscribeToPro() {
    return this.post('/subscription/pro');
  }

  async renewSubscription() {
    return this.post('/subscription/renew');
  }

  async getRemainingSessions() {
    return this.get('/subscription/remaining-sessions');
  }

  async handleTrialExpiry(autoPayToPro: boolean) {
    return this.post('/subscription/handle-trial-expiry', { autoPayToPro });
  }

  // Admin API methods
  async getAdminDashboardStats() {
    return this.get('/admin/dashboard/stats');
  }

  async getAdminCategories() {
    return this.get('/admin/categories');
  }

  async getAdminQuestions(params?: { categoryId?: string; page?: number; limit?: number; search?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    const queryString = queryParams.toString();
    return this.get(`/admin/questions${queryString ? `?${queryString}` : ''}`);
  }

  async getAdminUsers() {
    return this.get('/admin/users');
  }

  async getAdminImportLogs() {
    return this.get('/admin/import-logs');
  }
}

export const apiService = new ApiService();
export default ApiService;
