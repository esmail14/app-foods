import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';

// Keys
const RECIPES_KEY = 'mp_recipes_v1';
const MEALS_KEY = 'mp_meals_v1';
const PANTRY_KEY = 'mp_pantry_v1';

// Get current user
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// RECIPES

export async function getAllRecipes() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Transform data
    const recipes = (data || []).map(r => ({
      id: r.id,
      name: r.name,
      ingredients: r.ingredients || []
    }));

    // Cache locally
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    return recipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    // Fallback to local cache
    const raw = await AsyncStorage.getItem(RECIPES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRecipe(recipe) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const recipeData = {
      id: recipe.id || uuidv4(),
      name: recipe.name,
      ingredients: recipe.ingredients || [],
      user_id: user.id
    };

    if (recipe.id) {
      // Update existing
      const { error } = await supabase
        .from('recipes')
        .update({
          name: recipeData.name,
          ingredients: recipeData.ingredients,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeData.id);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase
        .from('recipes')
        .insert([recipeData]);

      if (error) throw error;
      recipe.id = recipeData.id;
    }

    // Update local cache
    const all = await getAllRecipes();
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
}

export async function deleteRecipe(id) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local cache
    const all = await getAllRecipes();
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
}

// MEALS

export async function getMealsForWeek(startOfWeek) {
  try {
    const user = await getCurrentUser();
    if (!user) return {};

    // Fetch all meals for this week
    const { data, error } = await supabase
      .from('meals')
      .select('*, recipes(id, name, ingredients)')
      .eq('user_id', user.id);

    if (error) throw error;

    // Group by day and meal_type
    const mealsMap = {};
    (data || []).forEach(meal => {
      if (!mealsMap[meal.day]) mealsMap[meal.day] = {};
      mealsMap[meal.day][meal.meal_type] = {
        id: meal.id,
        date: meal.day,
        mealType: meal.meal_type,
        recipeId: meal.recipe_id,
        recipeName: meal.recipes?.name || 'Unknown',
        ingredients: meal.recipes?.ingredients || []
      };
    });

    // Cache locally
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(mealsMap));
    return mealsMap;
  } catch (error) {
    console.error('Error fetching meals:', error);
    // Fallback to local cache
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    return raw ? JSON.parse(raw) : {};
  }
}

export async function addMealToDay(date, mealType, recipeId, recipeName, ingredients) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('meals')
      .insert([{
        user_id: user.id,
        day: date,
        meal_type: mealType,
        recipe_id: recipeId
      }]);

    if (error) throw error;

    // Update local cache
    const mealsMap = await getMealsForWeek(date);
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(mealsMap));
  } catch (error) {
    console.error('Error adding meal:', error);
    throw error;
  }
}

// Alias for backward compatibility
export async function saveMeal(mealEntry) {
  return addMealToDay(
    mealEntry.date,
    mealEntry.mealType,
    mealEntry.recipeId,
    mealEntry.recipeName,
    mealEntry.ingredients
  );
}

export async function deleteMealFromDay(date, mealId) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', mealId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local cache
    const mealsMap = await getMealsForWeek(date);
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(mealsMap));
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
}

// Alias for backward compatibility
export async function deleteMeal(date, mealType) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('day', date)
      .eq('meal_type', mealType)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local cache
    const mealsMap = await getMealsForWeek(date);
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(mealsMap));
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
}

// Pantry (keep local for now)
export async function getPantry() {
  const raw = await AsyncStorage.getItem(PANTRY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePantry(items) {
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
}