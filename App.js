import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/supabase';
import WeekView from './src/screens/WeekView';
import RecipeList from './src/screens/RecipeList';
import RecipeEditor from './src/screens/RecipeEditor';
import ShoppingList from './src/screens/ShoppingList';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={session ? 'WeekView' : 'Login'}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FF6B6B',
            borderBottomWidth: 2,
            borderBottomColor: '#E85555',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerBackTitleVisible: false,
        }}
      >
        {session ? (
          <>
            <Stack.Screen
              name="WeekView"
              component={WeekView}
              options={{ title: 'Planificador de Comidas' }}
            />
            <Stack.Screen
              name="Recipes"
              component={RecipeList}
              options={{ title: 'Recetas' }}
            />
            <Stack.Screen
              name="EditRecipe"
              component={RecipeEditor}
              options={{ title: 'Editar receta' }}
            />
            <Stack.Screen
              name="ShoppingList"
              component={ShoppingList}
              options={{ title: 'Lista de la compra' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Configuración' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Signup"
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}