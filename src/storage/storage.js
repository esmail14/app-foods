import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import { Logger } from '../utils/logger';

const MODULE = 'Storage';

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
    Logger.debug(MODULE, 'Fetching all recipes');
    const user = await getCurrentUser();
    if (!user) {
      Logger.warn(MODULE, 'No user logged in, returning empty recipes');
      return [];
    }

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
    Logger.info(MODULE, 'Recipes fetched: ' + recipes.length + ' recipes');
    return recipes;
  } catch (error) {
    Logger.error(MODULE, 'Error fetching recipes', error.message);
    console.error('Error fetching recipes:', error);
    // Fallback to local cache
    const raw = await AsyncStorage.getItem(RECIPES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRecipe(recipe) {
  try {
    Logger.info(MODULE, 'Saving recipe', recipe.name);
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
      Logger.debug(MODULE, 'Updating existing recipe', recipe.id);
      const { error } = await supabase
        .from('recipes')
        .update({
          name: recipeData.name,
          ingredients: recipeData.ingredients,
          updated_at: new Date().toISOString()
        })
        .eq('id', recipeData.id);

      if (error) throw error;
      Logger.info(MODULE, 'Recipe updated', recipe.name);
    } else {
      // Insert new
      Logger.debug(MODULE, 'Creating new recipe', recipe.name);
      const { error } = await supabase
        .from('recipes')
        .insert([recipeData]);

      if (error) throw error;
      recipe.id = recipeData.id;
      Logger.info(MODULE, 'Recipe created', recipe.name);
    }

    // Update local cache
    const all = await getAllRecipes();
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
  } catch (error) {
    Logger.error(MODULE, 'Error saving recipe', error.message);
    console.error('Error saving recipe:', error);
    throw error;
  }
}

export async function deleteRecipe(id) {
  try {
    Logger.info(MODULE, 'Deleting recipe', id);
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
    Logger.info(MODULE, 'Recipe deleted successfully', id);
  } catch (error) {
    Logger.error(MODULE, 'Error deleting recipe', error.message);
    console.error('Error deleting recipe:', error);
    throw error;
  }
}

// MEALS

export async function getMealsForWeek(startOfWeek) {
  try {
    Logger.debug(MODULE, 'Fetching meals for week');
    const user = await getCurrentUser();
    if (!user) {
      Logger.warn(MODULE, 'No user logged in, returning empty meals');
      return {};
    }

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
    Logger.info(MODULE, 'Weekly meals fetched');
    return mealsMap;
  } catch (error) {
    Logger.error(MODULE, 'Error fetching meals', error.message);
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

export async function saveMeal(mealEntry) {
  try {
    Logger.info(MODULE, 'Saving meal', mealEntry.date + ' - ' + mealEntry.mealType);
    return await addMealToDay(
      mealEntry.date,
      mealEntry.mealType,
      mealEntry.recipeId,
      mealEntry.recipeName,
      mealEntry.ingredients
    );
  } catch (error) {
    Logger.error(MODULE, 'Error saving meal', error.message);
    throw error;
  }
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
    Logger.info(MODULE, 'Deleting meal', date + ' - ' + mealType);
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
    Logger.info(MODULE, 'Meal deleted successfully', date + ' - ' + mealType);
  } catch (error) {
    Logger.error(MODULE, 'Error deleting meal', error.message);
    console.error('Error deleting meal:', error);
    throw error;
  }
}

// USER SETTINGS

export async function getUserSettings() {
  try {
    Logger.debug(MODULE, 'Fetching user settings');
    const user = await getCurrentUser();
    if (!user) {
      Logger.warn(MODULE, 'No user logged in, returning default settings');
      return { meal_count: 3, meal_names: ['Desayuno', 'Almuerzo', 'Cena'] };
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is expected for new users
      throw error;
    }

    if (data) {
      Logger.info(MODULE, 'User settings retrieved');
      return {
        meal_count: data.meal_count || 3,
        meal_names: data.meal_names || ['Desayuno', 'Almuerzo', 'Cena']
      };
    }

    // If no settings exist, return defaults
    Logger.debug(MODULE, 'No settings found, returning defaults');
    return { meal_count: 3, meal_names: ['Desayuno', 'Almuerzo', 'Cena'] };
  } catch (error) {
    Logger.error(MODULE, 'Error fetching user settings', error.message);
    console.error('Error fetching user settings:', error);
    // Return defaults on error
    return { meal_count: 3, meal_names: ['Desayuno', 'Almuerzo', 'Cena'] };
  }
}

export async function saveUserSettings(settings) {
  try {
    Logger.info(MODULE, 'Saving user settings');
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          meal_count: settings.meal_count,
          meal_names: settings.meal_names,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id' }
      );

    if (error) throw error;
    Logger.info(MODULE, 'User settings saved successfully');
  } catch (error) {
    Logger.error(MODULE, 'Error saving user settings', error.message);
    console.error('Error saving user settings:', error);
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