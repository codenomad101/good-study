# Padhlo Mobile App

A React Native exam preparation app built with Expo, featuring authentication, responsive design, and comprehensive study tools.

## Features

- 🔐 **Authentication System**: Login and registration with backend integration
- 📱 **Responsive Design**: Adapts to different screen sizes and orientations
- 📊 **Progress Tracking**: Visual progress indicators and statistics
- 🎯 **Practice Modes**: Topic-wise practice and mock tests
- 📈 **Analytics**: Weekly performance and subject-wise accuracy tracking
- 🔔 **Notifications**: Learning reminders and updates
- 👥 **Community**: User interaction and sharing features

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Node.js, Express, PostgreSQL, Drizzle ORM
- **Authentication**: JWT tokens with secure storage
- **Icons**: Lucide React Native
- **State Management**: React Context API
- **Storage**: AsyncStorage for local data persistence

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Install dependencies:**
   ```bash
   cd Padhlo
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on specific platforms:**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Backend Integration

The app connects to a backend API for authentication and data management. Make sure your backend is running on `http://localhost:3000` or update the API URL in `contexts/AuthContext.tsx`.

### Backend Setup
1. Navigate to the backend directory
2. Install dependencies: `npm install`
3. Set up your `.env` file with database credentials
4. Run migrations: `npm run db:migrate`
5. Start the server: `npm run dev`

## Project Structure

```
Padhlo/
├── app/                    # Expo Router pages
├── components/             # Reusable components
│   ├── ExamPrepApp.tsx    # Main app component
│   └── AuthScreens.tsx    # Login/Register screens
├── contexts/              # React Context providers
│   └── AuthContext.tsx   # Authentication context
├── utils/                 # Utility functions
│   └── responsive.ts     # Responsive design utilities
└── assets/               # Images and static assets
```

## Key Components

### ExamPrepApp
The main application component featuring:
- Home dashboard with learning streak and statistics
- Practice section with topic-wise questions
- Progress tracking with weekly performance
- Community features

### Authentication Screens
- **LoginScreen**: Email/password authentication
- **RegisterScreen**: User registration with validation
- Secure token storage and management

### Responsive Design
- Automatic scaling for different screen sizes
- Optimized layouts for phones and tablets
- Adaptive font sizes and spacing

## API Endpoints

The app integrates with the following backend endpoints:

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `GET /api/user/profile` - User profile data

## Development

### Adding New Features
1. Create components in the `components/` directory
2. Add context providers in `contexts/` if needed
3. Update the main `ExamPrepApp` component
4. Test on multiple screen sizes

### Responsive Design
Use the responsive utilities from `utils/responsive.ts`:
```typescript
import { responsiveValues, scaleWidth, scaleHeight } from '../utils/responsive';

// Use responsive values in styles
const styles = StyleSheet.create({
  container: {
    padding: responsiveValues.padding.medium,
    fontSize: responsiveValues.fontSize.base,
  },
});
```

### Authentication Flow
The app uses React Context for authentication state management:
- `AuthProvider` wraps the entire app
- `useAuth` hook provides authentication methods
- Automatic token verification and refresh
- Secure storage with AsyncStorage

## Building for Production

1. **Configure app settings** in `app.json`
2. **Build for platforms:**
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on multiple devices
5. Submit a pull request

## License

This project is licensed under the MIT License.