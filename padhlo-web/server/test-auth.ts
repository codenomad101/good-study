import { config } from 'dotenv';
import { AuthService } from './src/services/auth';

// Load environment variables
config();

async function testAuth() {
  const authService = new AuthService();
  
  try {
    console.log('🧪 Testing Auth Service...\n');
    
    // Test registration
    console.log('1. Testing user registration...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890'
    };
    
    const registerResult = await authService.register(registerData);
    console.log('✅ Registration successful:', {
      userId: registerResult.user.id,
      email: registerResult.user.email,
      token: registerResult.token.substring(0, 20) + '...'
    });
    
    // Test login
    console.log('\n2. Testing user login...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const loginResult = await authService.login(loginData);
    console.log('✅ Login successful:', {
      userId: loginResult.user.id,
      email: loginResult.user.email,
      token: loginResult.token.substring(0, 20) + '...'
    });
    
    // Test token verification
    console.log('\n3. Testing token verification...');
    const user = await authService.verifyToken(loginResult.token);
    console.log('✅ Token verification successful:', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName
    });
    
    console.log('\n🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

// Only run if this file is executed directly
if (require.main === module) {
  testAuth();
}

