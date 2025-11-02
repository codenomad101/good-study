# Padhlo Monorepo

A unified monorepo containing both web frontend and backend API, serving everything from a single server.

## Architecture

- **Backend**: Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL
- **Frontend**: Next.js + React + TypeScript + Tailwind CSS (built as static files)
- **Mobile App**: React Native/Expo (separate client using same backend API)
- **Monorepo**: Single server serves both API and web app on port 3000

## Project Structure

```
padhlo-web/
├── backend/          # Node.js/Express API server
├── frontend/         # Next.js web application (built to static files)
├── package.json      # Monorepo package management
└── README.md         # This file
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
npm run db:push
```

### 3. Build Frontend & Start Server
```bash
npm run build:frontend
npm run dev
```

**Access everything at: `http://localhost:3000`**
- Web app: `http://localhost:3000`
- API endpoints: `http://localhost:3000/api/*`
- Health check: `http://localhost:3000/health`

## Available Scripts

- `npm run dev` - Start backend server (serves both API and web app)
- `npm run dev:backend` - Start only backend server
- `npm run dev:frontend` - Start only frontend dev server (for development)
- `npm run build` - Build both backend and frontend for production
- `npm run build:frontend` - Build frontend to static files
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Practice Sessions
- `POST /api/practice/enhanced/complete/:userId` - Complete practice session
- `GET /api/practice/enhanced/history/:userId` - Get practice history
- `GET /api/practice/enhanced/stats/:userId` - Get practice statistics

### Dynamic Exams
- `POST /api/exam/dynamic/create` - Create dynamic exam session
- `POST /api/exam/dynamic/:sessionId/start` - Start exam session
- `GET /api/exam/dynamic/:sessionId/questions` - Get exam questions
- `POST /api/exam/dynamic/:sessionId/complete` - Complete exam session
- `GET /api/exam/dynamic/history` - Get exam history
- `GET /api/exam/dynamic/stats` - Get exam statistics

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://username:password@localhost:5432/padhlo
JWT_SECRET=your-jwt-secret
PORT=3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Database Schema

The application uses PostgreSQL with Drizzle ORM. Key tables include:

- `users` - User accounts and profiles
- `practice_sessions` - Practice session records
- `dynamic_exam_sessions` - Dynamic exam sessions
- `user_progress` - User progress tracking

## Features

### Backend Features
- ✅ User authentication and authorization
- ✅ Practice session management
- ✅ Dynamic exam system
- ✅ Question generation from multiple categories
- ✅ Timer and negative marking support
- ✅ Complete statistics and analytics
- ✅ PostgreSQL database with Drizzle ORM

### Frontend Features
- ✅ Modern Next.js 15 with TypeScript
- ✅ Tailwind CSS for styling
- ✅ Responsive design
- ✅ Practice session interface
- ✅ Dynamic exam interface
- ✅ User dashboard and statistics
- ✅ Real-time timer and progress tracking

## Development

### Backend Development
The backend is located in the `backend/` directory and uses:
- Node.js with Express
- TypeScript
- Drizzle ORM with PostgreSQL
- JWT authentication

### Frontend Development
The frontend is located in the `frontend/` directory and uses:
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- React Query for API calls

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Mobile App Integration

The Android mobile app (`Padhlo/`) connects to the same backend API endpoints, providing a consistent experience across web and mobile platforms.
