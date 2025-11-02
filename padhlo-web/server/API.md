# Exam Preparation App - API Documentation

## Overview
This is a comprehensive exam preparation application backend built with Node.js, Express, TypeScript, PostgreSQL, and Drizzle ORM.

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication (`/api/auth`)

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "dateOfBirth": "1990-01-01",
    "gender": "male"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

#### Verify Token
- **GET** `/api/auth/verify`
- **Headers:** `Authorization: Bearer <token>`

#### Update Profile
- **PUT** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "fullName": "John Smith",
    "phone": "+1234567890",
    "profilePictureUrl": "https://example.com/avatar.jpg"
  }
  ```

#### Change Password
- **PUT** `/api/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```

### User Management (`/api/user`)

#### Get User Profile
- **GET** `/api/user/profile`
- **Headers:** `Authorization: Bearer <token>`

### Exam Management (`/api/exam`)

#### Get All Exams
- **GET** `/api/exam/exams`

#### Get Exam by ID
- **GET** `/api/exam/exams/:examId`

#### Get Exam Structure (with subjects and topics)
- **GET** `/api/exam/exams/:examId/structure`

#### Get Subjects by Exam
- **GET** `/api/exam/exams/:examId/subjects`

#### Get Topics by Subject
- **GET** `/api/exam/subjects/:subjectId/topics`

#### Get Questions by Topic
- **GET** `/api/exam/topics/:topicId/questions?limit=50&offset=0`

#### Get Questions by Subject
- **GET** `/api/exam/subjects/:subjectId/questions?limit=50&offset=0`

#### Create Exam (Admin)
- **POST** `/api/exam/exams`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "examName": "SSC CGL",
    "examCode": "SSC_CGL",
    "description": "Staff Selection Commission Combined Graduate Level",
    "totalMarks": 200,
    "durationMinutes": 60
  }
  ```

#### Create Subject (Admin)
- **POST** `/api/exam/subjects`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "examId": "uuid",
    "subjectName": "Quantitative Aptitude",
    "subjectCode": "QA",
    "weightagePercentage": 25.0
  }
  ```

#### Create Topic (Admin)
- **POST** `/api/exam/topics`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "subjectId": "uuid",
    "topicName": "Number System",
    "difficultyLevel": "medium"
  }
  ```

#### Create Question (Admin)
- **POST** `/api/exam/questions`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "topicId": "uuid",
    "subjectId": "uuid",
    "examId": "uuid",
    "questionText": "What is 2+2?",
    "questionType": "mcq",
    "optionA": "3",
    "optionB": "4",
    "optionC": "5",
    "optionD": "6",
    "correctAnswer": "B",
    "difficultyLevel": "easy"
  }
  ```

#### User Exam Preferences
- **GET** `/api/exam/user/preferences` - Get user's exam preferences
- **POST** `/api/exam/user/preferences` - Set exam preference
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "examId": "uuid",
    "targetExamDate": "2024-12-01",
    "dailyStudyGoalMinutes": 60,
    "isPrimaryExam": true
  }
  ```

### Progress Tracking (`/api/progress`)

#### Get User Progress
- **GET** `/api/progress/progress?subjectId=uuid`

#### Get Topic Progress
- **GET** `/api/progress/progress/topic/:topicId`

#### Update Progress
- **PUT** `/api/progress/progress`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "topicId": "uuid",
    "subjectId": "uuid",
    "totalQuestionsAttempted": 10,
    "correctAnswers": 8,
    "totalTimeSpentSeconds": 300,
    "masteryLevel": "intermediate"
  }
  ```

#### Daily Practice Sessions
- **POST** `/api/progress/practice-sessions` - Create practice session
- **GET** `/api/progress/practice-sessions?startDate=2024-01-01&endDate=2024-01-31`
- **PUT** `/api/progress/practice-sessions/:sessionId` - Update session

#### Question History
- **POST** `/api/progress/question-history` - Add question attempt
- **GET** `/api/progress/question-history?questionId=uuid&limit=50`

#### User Statistics
- **GET** `/api/progress/stats?days=30` - Get user stats for last 30 days
- **GET** `/api/progress/stats/subject-wise` - Get subject-wise progress
- **GET** `/api/progress/stats/weak-topics?limit=10` - Get weak topics

### Test Management (`/api/test`)

#### Test Templates
- **GET** `/api/test/templates?examId=uuid` - Get all test templates
- **GET** `/api/test/templates/:templateId` - Get template by ID
- **POST** `/api/test/templates` - Create template (Admin)
- **PUT** `/api/test/templates/:templateId` - Update template (Admin)
- **DELETE** `/api/test/templates/:templateId` - Delete template (Admin)

#### User Tests
- **POST** `/api/test/user-tests` - Create user test
- **GET** `/api/test/user-tests?status=completed` - Get user's tests
- **GET** `/api/test/user-tests/:userTestId` - Get test by ID
- **PUT** `/api/test/user-tests/:userTestId/start` - Start test
- **PUT** `/api/test/user-tests/:userTestId/complete` - Complete test
- **PUT** `/api/test/user-tests/:userTestId/abandon` - Abandon test

#### Test Responses
- **POST** `/api/test/responses` - Submit test response
- **GET** `/api/test/user-tests/:userTestId/responses` - Get test responses
- **PUT** `/api/test/responses/:responseId` - Update response

#### Test Generation
- **POST** `/api/test/generate-questions` - Generate test questions
- **Body:**
  ```json
  {
    "templateId": "uuid",
    "examId": "uuid",
    "subjectIds": ["uuid1", "uuid2"]
  }
  ```

#### Test Analytics
- **GET** `/api/test/analytics?days=30` - Get user test analytics
- **GET** `/api/test/templates/:templateId/leaderboard?limit=100` - Get leaderboard
- **GET** `/api/test/user-tests/:userTestId/rank` - Get user's rank in test

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

## Database Schema

### Key Tables
- **users** - User accounts and profiles
- **exams** - Available exams (SSC CGL, RRB NTPC, etc.)
- **subjects** - Subjects within exams
- **topics** - Topics within subjects
- **questions** - Question bank
- **user_tests** - User test attempts
- **user_progress** - User learning progress
- **daily_practice_sessions** - Daily practice tracking
- **user_notes** - Personal notes
- **study_materials** - Study resources
- **notifications** - User notifications

### Key Features
- **UUID Primary Keys** - All entities use UUID for better scalability
- **Comprehensive Progress Tracking** - Track learning progress at topic, subject, and exam levels
- **Test Management** - Full test creation, execution, and analytics
- **Gamification** - Points, levels, streaks, and achievements
- **Study Materials** - Support for various content types
- **Community Features** - Study groups, forums, and discussions
- **Analytics** - Detailed performance analytics and insights

## Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/padhlo_db
JWT_SECRET=your-super-secret-jwt-key
PORT=3000
NODE_ENV=development
```

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables
3. Run database migrations: `npm run db:push`
4. Start the server: `npm run dev`

## Sample Data

The system includes sample data for:
- SSC CGL, RRB NTPC, IBPS PO, State PSC exams
- Subjects: Quantitative Aptitude, Reasoning, General Awareness, English
- Topics and questions for each subject
- Test templates and practice sessions