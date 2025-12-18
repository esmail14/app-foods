import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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
const Drawer = createDrawerNavigator();

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

  function AppNavigator() {
    return (
      <Drawer.Navigator
        screenOptions={{
          headerShown: true,
          drawerType: 'front',
          drawerStyle: {
            backgroundColor: '#fff',
            width: 280,
          },
          drawerLabelStyle: {
            fontSize: 16,
            marginLeft: -20,
          },
          headerStyle: {
            backgroundColor: '#FF6B6B',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Drawer.Screen
          name="Home"
          component={WeekViewNavigator}
          options={{
            title: 'Planificador',
            drawerLabel: '📅 Semana',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="SettingsDrawer"
          component={SettingsScreen}
          options={{
            title: 'Configuración',
            drawerLabel: '⚙️ Configuración',
          }}
        />
        <Drawer.Screen
          name="LogoutScreen"
          options={{
            title: '',
            drawerLabel: '🚪 Cerrar Sesión',
            headerShown: false,
            unmountOnBlur: true,
          }}
          listeners={({ navigation }) => ({
            drawerItemPress: (e) => {
              e.preventDefault();
              handleLogout(navigation);
            },
          })}
          component={() => null}
        />
      </Drawer.Navigator>
    );
  }

  function WeekViewNavigator() {
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="WeekView"
          component={WeekView}
          options={{
            title: 'Planificador de Comidas',
            headerStyle: {
              backgroundColor: '#FF6B6B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="Recipes"
          component={RecipeList}
          options={{
            title: 'Recetas',
            headerStyle: {
              backgroundColor: '#FF6B6B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="EditRecipe"
          component={RecipeEditor}
          options={{
            title: 'Editar receta',
            headerStyle: {
              backgroundColor: '#FF6B6B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="ShoppingList"
          component={ShoppingList}
          options={{
            title: 'Lista de la compra',
            headerStyle: {
              backgroundColor: '#FF6B6B',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    );
  }

  async function handleLogout(navigation) {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  return (
    <NavigationContainer>
      {session ? (
        <AppNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}