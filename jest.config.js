/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // Proyecto 1: Tests de utilidades puras (sin React Native)
    // Estas funcionan con cualquier versión de Node.js
    {
      displayName: 'utils',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/ingredients.test.js'],
      transform: {
        '\\.[jt]sx?$': [
          'babel-jest',
          { presets: ['babel-preset-expo'] },
        ],
      },
      transformIgnorePatterns: ['/node_modules/'],
    },
    // Proyecto 2: Tests de componentes con preset Expo
    // NOTA: Requiere Expo SDK 55+ para compatibilidad con Node.js v22+
    // (jest-expo 54 tiene una incompatibilidad conocida con Object.defineProperty en Node 22+)
    // Para activar: actualizar a Expo SDK 55 con `npx expo upgrade`
    // {
    //   displayName: 'components',
    //   preset: 'jest-expo',
    //   testMatch: [
    //     '<rootDir>/__tests__/LoginScreen.test.js',
    //     '<rootDir>/__tests__/RecipeEditor.test.js',
    //   ],
    //   transformIgnorePatterns: [
    //     'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)',
    //   ],
    // },
  ],
};
