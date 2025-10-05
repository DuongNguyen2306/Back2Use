// Test API connection
import { API_BASE_URL } from '../constants';

export const testApiConnection = async (): Promise<boolean> => {
  try {
    // Test with auth/login endpoint since /health doesn't exist
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
    });
    
    // 401 is expected for invalid credentials, means server is responding
    return response.status === 401 || response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

// Test specific endpoints
export const testAuthEndpoints = async () => {
  const results = {
    login: false,
    register: false,
    forgotPassword: false,
  };

  try {
    // Test login endpoint (should return 400 for missing data, but endpoint exists)
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    results.login = loginResponse.status === 400; // Expected for missing credentials

    // Test register endpoint
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    results.register = registerResponse.status === 400; // Expected for missing data

    // Test forgot password endpoint
    const forgotResponse = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    results.forgotPassword = forgotResponse.status === 400; // Expected for missing email

  } catch (error) {
    console.error('Auth endpoints test failed:', error);
  }

  return results;
};
