import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Pressable, Text } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/firebase';
import WeekView from './src/screens/WeekView';
import RecipeList from './src/screens/RecipeList';
import RecipeEditor from './src/screens/RecipeEditor';
import ShoppingList from './src/screens/ShoppingList';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Iniciar sesión' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Crear cuenta' }}
      />
    </Stack.Navigator>
  );
}

function AppStack({ onLogout }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={onLogout} style={{ marginRight: 16 }}>
            <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: '600' }}>
              Cerrar sesión
            </Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="Week" component={WeekView} options={{ title: 'Semana' }} />
      <Stack.Screen name="Recipes" component={RecipeList} options={{ title: 'Recetas' }} />
      <Stack.Screen name="EditRecipe" component={RecipeEditor} options={{ title: 'Editar receta' }} />
      <Stack.Screen name="ShoppingList" component={ShoppingList} options={{ title: 'Lista de la compra' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack onLogout={handleLogout} /> : <AuthStack />}
    </NavigationContainer>
  );
}