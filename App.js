import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WeekView from './src/screens/WeekView';
import RecipeList from './src/screens/RecipeList';
import RecipeEditor from './src/screens/RecipeEditor';
import ShoppingList from './src/screens/ShoppingList';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Week">
        <Stack.Screen name="Week" component={WeekView} options={{ title: 'Semana' }} />
        <Stack.Screen name="Recipes" component={RecipeList} options={{ title: 'Recetas' }} />
        <Stack.Screen name="EditRecipe" component={RecipeEditor} options={{ title: 'Editar receta' }} />
        <Stack.Screen name="ShoppingList" component={ShoppingList} options={{ title: 'Lista de la compra' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}