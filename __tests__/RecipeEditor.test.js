import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RecipeEditor from '../src/screens/RecipeEditor';

// Mock navigation
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockRoute = { params: {} };

// Mock storage
jest.mock('../src/storage/storage', () => ({
  saveRecipe: jest.fn(),
  getAllRecipes: jest.fn().mockResolvedValue([]),
}));

// Mock Supabase
jest.mock('../src/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }) },
  },
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock Logger
jest.mock('../src/utils/logger', () => ({
  Logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

describe('RecipeEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recipe name input', () => {
    const { getByPlaceholderText } = render(
      <RecipeEditor navigation={mockNavigation} route={mockRoute} />
    );
    expect(getByPlaceholderText(/nombre de la receta/i)).toBeTruthy();
  });

  it('shows validation error when saving without name', () => {
    const { getByText } = render(
      <RecipeEditor navigation={mockNavigation} route={mockRoute} />
    );
    const saveBtn = getByText(/guardar/i);
    fireEvent.press(saveBtn);
    expect(getByText(/nombre/i)).toBeTruthy();
  });

  it('accepts recipe name input', () => {
    const { getByPlaceholderText } = render(
      <RecipeEditor navigation={mockNavigation} route={mockRoute} />
    );
    const input = getByPlaceholderText(/nombre de la receta/i);
    fireEvent.changeText(input, 'Tortilla española');
    expect(input.props.value).toBe('Tortilla española');
  });
});
