# Padhlo Backend

Backend API for the Padhlo mobile application built with Express.js, PostgreSQL, and Drizzle ORM.

## Features

- User registration and authentication
- JWT token-based authentication
- PostgreSQL database with Drizzle ORM
- Input validation with Zod
- Password hashing with bcrypt
- TypeScript support

## Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Update the `.env` file with your database credentials:
```
DATABASE_URL=postgresql://username:password@localhost:5432/padhlo_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=3000
NODE_ENV=development
```

4. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Health Check

- `GET /health` - Server health status

## Database Schema

### Users Table

- `id` - Primary key (serial)
- `email` - Unique email address
- `password` - Hashed password
- `firstName` - User's first name
- `lastName` - User's last name
- `phone` - Optional phone number
- `isActive` - Account status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:studio` - Open Drizzle Studio for database management

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

