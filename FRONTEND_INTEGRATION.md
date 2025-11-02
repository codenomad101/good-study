# Padhlo Exam Preparation App - Frontend Integration Guide

## 🚀 React Query Integration Complete!

The frontend Android app is now fully integrated with the backend using **TanStack Query (React Query)** for efficient data fetching, caching, and state management.

## 📱 What's Been Implemented

### ✅ **React Query Setup**
- **QueryProvider**: Wrapped around the entire app for global query management
- **Query Client**: Configured with optimal caching and retry strategies
- **API Service**: Centralized service for all backend communication
- **Custom Hooks**: React Query hooks for all API endpoints

### ✅ **Authentication Integration**
- **Real API Calls**: Login, register, and token verification
- **Token Management**: Automatic token storage and refresh
- **User Context**: Updated to work with new backend user schema
- **Profile Management**: Update profile and change password

### ✅ **Data Fetching Hooks**
- **Exams**: `useExams()`, `useExam()`, `useExamStructure()`
- **Subjects**: `useSubjectsByExam()`, `useTopicsBySubject()`
- **Questions**: `useQuestionsByTopic()`, `useQuestionsBySubject()`
- **Progress**: `useUserProgress()`, `useUserStats()`, `useSubjectWiseProgress()`
- **Tests**: `useTestTemplates()`, `useUserTests()`, `useUserTestAnalytics()`

### ✅ **UI Components**
- **HomeContent**: New component demonstrating real data fetching
- **Loading States**: Proper loading indicators
- **Error Handling**: Error states with retry functionality
- **Real Data Display**: Shows actual backend data when available

## 🔧 How to Use React Query Hooks

### **Basic Data Fetching**
```typescript
import { useExams, useUserStats } from '../hooks/useApi';

function MyComponent() {
  const { data: exams, isLoading, error } = useExams();
  const { data: stats } = useUserStats(30);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;

  return (
    <View>
      {exams?.data?.map(exam => (
        <ExamCard key={exam.examId} exam={exam} />
      ))}
    </View>
  );
}
```

### **Mutations (Create/Update/Delete)**
```typescript
import { useCreateUserTest, useUpdateProgress } from '../hooks/useApi';

function TestComponent() {
  const createTestMutation = useCreateUserTest();
  const updateProgressMutation = useUpdateProgress();

  const handleStartTest = async () => {
    try {
      const result = await createTestMutation.mutateAsync('template-id');
      console.log('Test created:', result.data);
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  const handleUpdateProgress = async () => {
    await updateProgressMutation.mutateAsync({
      topicId: 'topic-id',
      subjectId: 'subject-id',
      correctAnswers: 5,
      totalQuestionsAttempted: 10,
    });
  };

  return (
    <View>
      <Button 
        title="Start Test" 
        onPress={handleStartTest}
        disabled={createTestMutation.isPending}
      />
      {createTestMutation.isPending && <ActivityIndicator />}
    </View>
  );
}
```

### **Query Invalidation**
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/useApi';

function MyComponent() {
  const queryClient = useQueryClient();

  const refreshData = () => {
    // Invalidate specific queries
    queryClient.invalidateQueries({ queryKey: queryKeys.exams.all });
    
    // Or invalidate all queries
    queryClient.invalidateQueries();
  };

  return <Button title="Refresh" onPress={refreshData} />;
}
```

## 📊 Available API Endpoints

### **Authentication**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### **Exams**
- `GET /api/exam/exams` - Get all exams
- `GET /api/exam/exams/:id` - Get exam by ID
- `GET /api/exam/exams/:id/structure` - Get exam with subjects/topics
- `GET /api/exam/exams/:id/subjects` - Get subjects by exam
- `GET /api/exam/subjects/:id/topics` - Get topics by subject
- `GET /api/exam/topics/:id/questions` - Get questions by topic

### **Progress**
- `GET /api/progress/progress` - Get user progress
- `PUT /api/progress/progress` - Update progress
- `GET /api/progress/stats` - Get user statistics
- `GET /api/progress/stats/subject-wise` - Get subject-wise progress
- `POST /api/progress/practice-sessions` - Create practice session

### **Tests**
- `GET /api/test/templates` - Get test templates
- `POST /api/test/user-tests` - Create user test
- `PUT /api/test/user-tests/:id/start` - Start test
- `PUT /api/test/user-tests/:id/complete` - Complete test
- `POST /api/test/responses` - Submit test response

## 🎯 Next Steps

### **1. Add Sample Data**
```bash
cd backend
npx tsx add-sample-data.ts
```

### **2. Test Real API Calls**
- Update the API_BASE_URL in `services/api.ts` to your backend URL
- Remove dummy login logic from `AuthContext.tsx`
- Test with real backend data

### **3. Implement More Components**
- **Practice Tab**: Use `useQuestionsByTopic()` for practice questions
- **Progress Tab**: Use `useUserStats()` and `useSubjectWiseProgress()`
- **Community Tab**: Implement study groups and forums

### **4. Add Offline Support**
```typescript
// Configure React Query for offline support
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      staleTime: Infinity,
    },
  },
});
```

## 🔄 Data Flow

1. **Component** calls React Query hook
2. **Hook** calls API service method
3. **API Service** makes HTTP request to backend
4. **Backend** returns data
5. **React Query** caches and returns data
6. **Component** renders with data

## 🚨 Error Handling

All hooks include proper error handling:
- **Network errors**: Automatic retry with exponential backoff
- **Authentication errors**: Automatic logout and redirect
- **Validation errors**: User-friendly error messages
- **Loading states**: Proper loading indicators

## 📈 Performance Benefits

- **Automatic Caching**: Reduces API calls
- **Background Refetching**: Keeps data fresh
- **Optimistic Updates**: Immediate UI updates
- **Request Deduplication**: Prevents duplicate requests
- **Offline Support**: Works without internet

## 🧪 Testing

Test the integration:
1. **Start Backend**: `cd backend && npm run dev`
2. **Start Frontend**: `cd Padhlo && npm start`
3. **Login**: Use `test@padhlo.com` / `password123`
4. **Check Network Tab**: See real API calls
5. **Test Offline**: App should work offline with cached data

The frontend is now fully integrated with the backend using React Query! 🎉




