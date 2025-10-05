import { Redirect } from 'expo-router';

// Redirect to login by default
export default function AuthIndex() {
  return <Redirect href="/auth/login" />;
}

// Auth screens exports
export { default as LoginScreen } from './login';
export { default as RegisterScreen } from './register';
export { default as ForgotPasswordScreen } from './forgot-password';
