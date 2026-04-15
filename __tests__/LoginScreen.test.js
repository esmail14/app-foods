import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';

// Mock Supabase
jest.mock('../src/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

// Mock Logger
jest.mock('../src/utils/logger', () => ({
  Logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockNavigation = { navigate: jest.fn() };

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    expect(getByPlaceholderText(/email/i)).toBeTruthy();
    expect(getByPlaceholderText(/contraseña/i)).toBeTruthy();
  });

  it('shows error when submitting empty email', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    const loginBtn = getByText(/iniciar sesión/i);
    fireEvent.press(loginBtn);
    expect(getByText(/email/i)).toBeTruthy();
  });

  it('navigates to Signup when pressing register link', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    const registerBtn = getByText(/registrarse/i);
    fireEvent.press(registerBtn);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });
});
