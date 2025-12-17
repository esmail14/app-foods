import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

// Keys
const RECIPES_KEY = 'mp_recipes_v1';
const MEALS_KEY = 'mp_meals_v1';
const PANTRY_KEY = 'mp_pantry_v1';

// Utilities to handle recipes and meals (simple AsyncStorage-based)

// Recipes: array of { id, name, ingredients: [{name, amount, unit}] }
export async function getAllRecipes() {
  const raw = await AsyncStorage.getItem(RECIPES_KEY);
  if (!raw) {
    // seed example
    const seed = [{
      id: uuidv4(),
      name: 'Ensalada rápida',
      ingredients: [{ name: 'lechuga', amount: 1, unit: 'unidad' }, { name: 'tomate', amount: 2, unit: 'unidad' }]
    }];
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(seed));
    return seed;
  }
  try { return JSON.parse(raw); } catch { return []; }
}

export async function saveRecipe(recipe) {
  const all = await getAllRecipes();
  if (recipe.id) {
    const idx = all.findIndex(r => r.id === recipe.id);
    if (idx >= 0) { all[idx] = recipe; }
    else { all.push({ ...recipe, id: recipe.id }); }
  } else {
    all.push({ ...recipe, id: uuidv4() });
  }
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
}

export async function deleteRecipe(id) {
  const all = await getAllRecipes();
  const filtered = all.filter(r => r.id !== id);
  await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
}

// Meals stored by date string: object { [date]: { mealType: mealEntry } }
// mealEntry: { date, mealType, recipeId, recipeName, ingredients }
export async function getMealsForWeek(startOfWeek) {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  const data = raw ? JSON.parse(raw) : {};
  // build 7-day map
  const result = {};
  const monday = new Date(startOfWeek);
  for (let i=0;i<7;i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0,10);
    result[key] = data[key] || {};
  }
  return result;
}

export async function saveMeal(mealEntry) {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  const data = raw ? JSON.parse(raw) : {};
  if (!data[mealEntry.date]) data[mealEntry.date] = {};
  data[mealEntry.date][mealEntry.mealType] = mealEntry;
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
}

export async function deleteMeal(date, mealType) {
  const raw = await AsyncStorage.getItem(MEALS_KEY);
  const data = raw ? JSON.parse(raw) : {};
  if (data[date] && data[date][mealType]) {
    delete data[date][mealType];
  }
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
}

// Pantry: array of { name, amount, unit }
export async function getPantry() {
  const raw = await AsyncStorage.getItem(PANTRY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function savePantry(items) {
  await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
}