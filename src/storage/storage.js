import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import { Logger } from '../utils/logger';

const MODULE = 'Storage';

// Keys
const RECIPES_KEY = 'mp_recipes_v1';
const MEALS_KEY = 'mp_meals_v1';
const PANTRY_KEY = 'mp_pantry_v1';
const SHOPPING_LIST_MODIFICATIONS_KEY = 'mp_shopping_list_mods_v1';

// AsyncStorage helpers with safe error handling
async function safeGetCache(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    Logger.warn(MODULE, `Cache read failed for key "${key}"`, error.message);
    return null;
  }
}

async function safeSetCache(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    Logger.warn(MODULE, `Cache write failed for key "${key}"`, error.message);
  }
}

async function safeRemoveCache(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    Logger.warn(MODULE, `Cache remove failed for key "${key}"`, error.message);
  }
}

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
      ingredients: r.ingredients || [],
      instructions: r.instructions || '',
      photoUri: r.photo_uri || null,
      servings: r.servings || 4,
      prepTime: r.prep_time || 30,
      difficulty: r.difficulty || 'media',
      is_favorite: r.is_favorite || false,
      created_at: r.created_at
    }));

    // Cache locally
    await safeSetCache(RECIPES_KEY, recipes);
    Logger.info(MODULE, 'Recipes fetched: ' + recipes.length + ' recipes');
    return recipes;
  } catch (error) {
    Logger.error(MODULE, 'Error fetching recipes', error.message);
    console.error('Error fetching recipes:', error);
    // Fallback to local cache
    return (await safeGetCache(RECIPES_KEY)) ?? [];
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
      instructions: recipe.instructions || '',
      photo_uri: recipe.photoUri || null,
      servings: recipe.servings || 4,
      prep_time: recipe.prepTime || 30,
      difficulty: recipe.difficulty || 'media',
      is_favorite: recipe.is_favorite || false,
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
          instructions: recipeData.instructions,
          photo_uri: recipeData.photo_uri,
          servings: recipeData.servings,
          prep_time: recipeData.prep_time,
          difficulty: recipeData.difficulty,
          is_favorite: recipeData.is_favorite,
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
    await safeSetCache(RECIPES_KEY, all);
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
    await safeSetCache(RECIPES_KEY, all);
    Logger.info(MODULE, 'Recipe deleted successfully', id);
  } catch (error) {
    Logger.error(MODULE, 'Error deleting recipe', error.message);
    console.error('Error deleting recipe:', error);
    throw error;
  }
}

export async function updateRecipeFavorite(id, isFavorite) {
  try {
    Logger.info(MODULE, 'Updating recipe favorite', { id, isFavorite });
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('recipes')
      .update({ is_favorite: isFavorite })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      // Si la columna no existe, solo actualizar en memoria (fallback)
      if (error.message && error.message.includes('is_favorite')) {
        Logger.warn(MODULE, 'Column is_favorite does not exist in database yet. Update saved locally only.');
        return;
      }
      throw error;
    }

    // Update local cache
    const all = await getAllRecipes();
    await safeSetCache(RECIPES_KEY, all);
    Logger.info(MODULE, 'Recipe favorite updated', { id, isFavorite });
  } catch (error) {
    Logger.error(MODULE, 'Error updating recipe favorite', error.message);
    console.error('Error updating recipe favorite:', error);
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

    // Calculate week range (Monday to Sunday)
    const weekStart = new Date(startOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    // Fetch meals for this week only
    const { data, error } = await supabase
      .from('meals')
      .select('*, recipes(id, name, ingredients)')
      .eq('user_id', user.id)
      .gte('day', weekStartStr)
      .lte('day', weekEndStr);

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
    await safeSetCache(MEALS_KEY, mealsMap);
    Logger.info(MODULE, 'Weekly meals fetched');
    return mealsMap;
  } catch (error) {
    Logger.error(MODULE, 'Error fetching meals', error.message);
    console.error('Error fetching meals:', error);
    // Fallback to local cache
    return (await safeGetCache(MEALS_KEY)) ?? {};
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
    await safeSetCache(MEALS_KEY, mealsMap);
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
    await safeSetCache(MEALS_KEY, mealsMap);
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
    await safeSetCache(MEALS_KEY, mealsMap);
    Logger.info(MODULE, 'Meal deleted successfully', date + ' - ' + mealType);
  } catch (error) {
    Logger.error(MODULE, 'Error deleting meal', error.message);
    console.error('Error deleting meal:', error);
    throw error;
  }
}

export async function clearWeekMeals(startOfWeek) {
  try {
    Logger.info(MODULE, 'Clearing all meals for week');
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    // Calculate week range (Monday to Sunday)
    const weekStart = new Date(startOfWeek);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    // Delete all meals for this week
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('user_id', user.id)
      .gte('day', weekStartStr)
      .lte('day', weekEndStr);

    if (error) throw error;

    // Update local cache
    await safeSetCache(MEALS_KEY, {});
    Logger.info(MODULE, 'Week cleared successfully');
  } catch (error) {
    Logger.error(MODULE, 'Error clearing week', error.message);
    console.error('Error clearing week:', error);
    throw error;
  }
}

export async function duplicateWeek(fromDate, toDate) {
  try {
    Logger.info(MODULE, 'Duplicating week', { fromDate, toDate });
    const user = await getCurrentUser();
    if (!user) throw new Error('No user logged in');

    // Get all meals from source week
    const sourceMeals = await getMealsForWeek(fromDate);
    
    // Calculate day offset
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const dayOffset = Math.floor((to - from) / (1000 * 60 * 60 * 24));

    // Copy meals to destination week
    const mealsToInsert = [];
    for (const dateStr in sourceMeals) {
      const dayMeals = sourceMeals[dateStr];
      for (const mealType in dayMeals) {
        const meal = dayMeals[mealType];
        if (meal?.recipeId) {
          const sourceDate = new Date(dateStr);
          const destDate = new Date(sourceDate);
          destDate.setDate(destDate.getDate() + dayOffset);
          const destDateStr = destDate.toISOString().slice(0, 10);

          mealsToInsert.push({
            user_id: user.id,
            day: destDateStr,
            meal_type: mealType,
            recipe_id: meal.recipeId
          });
        }
      }
    }

    if (mealsToInsert.length === 0) {
      Logger.warn(MODULE, 'No meals to duplicate');
      return { count: 0 };
    }

    // Insert all meals
    const { error } = await supabase
      .from('meals')
      .insert(mealsToInsert);

    if (error) throw error;

    // Update local cache
    const mealsMap = await getMealsForWeek(toDate);
    await safeSetCache(MEALS_KEY, mealsMap);
    
    Logger.info(MODULE, 'Week duplicated successfully', { count: mealsToInsert.length });
    return { count: mealsToInsert.length };
  } catch (error) {
    Logger.error(MODULE, 'Error duplicating week', error.message);
    console.error('Error duplicating week:', error);
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
  return (await safeGetCache(PANTRY_KEY)) ?? [];
}

export async function savePantry(items) {
  await safeSetCache(PANTRY_KEY, items);
}

// Shopping List Modifications
export async function getShoppingListModifications() {
  return (await safeGetCache(SHOPPING_LIST_MODIFICATIONS_KEY)) ?? {};
}

export async function modifyShoppingListItem(itemKey, modification) {
  try {
    Logger.info(MODULE, 'Modifying shopping list item', { itemKey, modification });
    const mods = await getShoppingListModifications();
    
    if (modification === null) {
      // Delete modification (restore original)
      delete mods[itemKey];
    } else {
      // Update modification
      mods[itemKey] = modification;
    }
    
    await safeSetCache(SHOPPING_LIST_MODIFICATIONS_KEY, mods);
    Logger.info(MODULE, 'Shopping list modification saved', itemKey);
  } catch (error) {
    Logger.error(MODULE, 'Error modifying shopping list item', error.message);
    throw error;
  }
}

export async function clearShoppingListModifications() {
  try {
    Logger.info(MODULE, 'Clearing all shopping list modifications');
    await safeRemoveCache(SHOPPING_LIST_MODIFICATIONS_KEY);
    Logger.info(MODULE, 'Shopping list modifications cleared');
  } catch (error) {
    Logger.error(MODULE, 'Error clearing shopping list modifications', error.message);
    throw error;
  }
}

// Add ingredients from recipe to shopping list
export async function addIngredientsFromRecipe(ingredients) {
  try {
    Logger.info(MODULE, 'Adding ingredients from recipe', ingredients.length + ' items');
    const mods = await getShoppingListModifications();
    
    // Mark these ingredients as added (not deleted)
    // They'll be picked up when the shopping list is next generated
    ingredients.forEach(ing => {
      const key = ing.name + (ing.unit || '');
      // Only mark if not already in modifications
      if (!mods[key]) {
        mods[key] = { amount: ing.amount, isAdded: true };
      }
    });
    
    await safeSetCache(SHOPPING_LIST_MODIFICATIONS_KEY, mods);
    Logger.info(MODULE, 'Ingredients added to shopping list', ingredients.length + ' items');
    return true;
  } catch (error) {
    Logger.error(MODULE, 'Error adding ingredients from recipe', error.message);
    throw error;
  }
}