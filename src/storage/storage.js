import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  setDoc,
  getDoc,
} from 'firebase/firestore';

// Keys para AsyncStorage (caché local)
const RECIPES_KEY = 'mp_recipes_v1';
const MEALS_KEY = 'mp_meals_v1';
const PANTRY_KEY = 'mp_pantry_v1';

// Helper para verificar si hay usuario autenticado
function getCurrentUser() {
  return auth.currentUser;
}

// ============= RECIPES =============

export async function getAllRecipes() {
  const user = getCurrentUser();
  
  // Sin usuario: usar solo AsyncStorage
  if (!user) {
    const raw = await AsyncStorage.getItem(RECIPES_KEY);
    if (!raw) {
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

  // Con usuario: intentar traer de Firestore
  try {
    const q = query(collection(db, 'recipes'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const recipes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Guardar en caché local
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(recipes));
    return recipes;
  } catch (error) {
    console.warn('Error fetching recipes from Firestore, using cache:', error);
    // Fallback a caché local si hay error
    const raw = await AsyncStorage.getItem(RECIPES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function saveRecipe(recipe) {
  const user = getCurrentUser();
  
  // Sin usuario: solo AsyncStorage
  if (!user) {
    const all = await getAllRecipes();
    if (recipe.id) {
      const idx = all.findIndex(r => r.id === recipe.id);
      if (idx >= 0) { all[idx] = recipe; }
      else { all.push({ ...recipe, id: recipe.id }); }
    } else {
      all.push({ ...recipe, id: uuidv4() });
    }
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
    return;
  }

  // Con usuario: guardar en Firestore
  try {
    const recipeData = {
      ...recipe,
      userId: user.uid,
      updatedAt: new Date(),
    };

    if (recipe.id) {
      // Actualizar documento existente
      const docRef = doc(db, 'recipes', recipe.id);
      await updateDoc(docRef, recipeData);
    } else {
      // Crear nuevo documento
      const newId = uuidv4();
      await setDoc(doc(db, 'recipes', newId), {
        ...recipeData,
        id: newId,
      });
    }

    // Actualizar caché local
    const all = await getAllRecipes();
    const idx = all.findIndex(r => r.id === recipe.id);
    if (idx >= 0) { all[idx] = recipe; }
    else { all.push(recipe); }
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(all));
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
}

export async function deleteRecipe(id) {
  const user = getCurrentUser();
  
  // Sin usuario: solo AsyncStorage
  if (!user) {
    const all = await getAllRecipes();
    const filtered = all.filter(r => r.id !== id);
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
    return;
  }

  // Con usuario: eliminar de Firestore
  try {
    await deleteDoc(doc(db, 'recipes', id));
    
    // Actualizar caché local
    const all = await getAllRecipes();
    const filtered = all.filter(r => r.id !== id);
    await AsyncStorage.setItem(RECIPES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
}

// ============= MEALS =============

export async function getMealsForWeek(startOfWeek) {
  const user = getCurrentUser();
  
  // Estructura base
  const result = {};
  const monday = new Date(startOfWeek);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result[key] = {};
  }

  // Sin usuario: usar AsyncStorage
  if (!user) {
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { ...result, ...data };
  }

  // Con usuario: traer de Firestore
  try {
    const q = query(collection(db, 'meals'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    snapshot.docs.forEach(doc => {
      const meal = doc.data();
      if (result[meal.date]) {
        result[meal.date][meal.mealType] = { ...meal, id: doc.id };
      }
    });

    // Guardar en caché
    const flatData = {};
    Object.keys(result).forEach(date => {
      flatData[date] = result[date];
    });
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(flatData));
    return result;
  } catch (error) {
    console.warn('Error fetching meals from Firestore, using cache:', error);
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return { ...result, ...data };
  }
}

export async function saveMeal(mealEntry) {
  const user = getCurrentUser();
  
  // Sin usuario: solo AsyncStorage
  if (!user) {
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[mealEntry.date]) data[mealEntry.date] = {};
    data[mealEntry.date][mealEntry.mealType] = mealEntry;
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
    return;
  }

  // Con usuario: guardar en Firestore
  try {
    const mealData = {
      ...mealEntry,
      userId: user.uid,
      updatedAt: new Date(),
    };

    const q = query(
      collection(db, 'meals'),
      where('userId', '==', user.uid),
      where('date', '==', mealEntry.date),
      where('mealType', '==', mealEntry.mealType)
    );
    const snapshot = await getDocs(q);

    if (snapshot.docs.length > 0) {
      // Actualizar documento existente
      await updateDoc(snapshot.docs[0].ref, mealData);
    } else {
      // Crear nuevo documento
      await addDoc(collection(db, 'meals'), mealData);
    }

    // Actualizar caché
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[mealEntry.date]) data[mealEntry.date] = {};
    data[mealEntry.date][mealEntry.mealType] = mealEntry;
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving meal:', error);
    throw error;
  }
}

export async function deleteMeal(date, mealType) {
  const user = getCurrentUser();

  try {
    // Sin usuario: solo AsyncStorage
    if (!user) {
      const raw = await AsyncStorage.getItem(MEALS_KEY);
      const data = raw ? JSON.parse(raw) : {};
      
      if (data[date] && data[date][mealType]) {
        delete data[date][mealType];
        if (Object.keys(data[date]).length === 0) {
          delete data[date];
        }
      }
      
      await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
      return true;
    }

    // Con usuario: eliminar de Firestore
    const q = query(
      collection(db, 'meals'),
      where('userId', '==', user.uid),
      where('date', '==', date),
      where('mealType', '==', mealType)
    );
    const snapshot = await getDocs(q);

    if (snapshot.docs.length > 0) {
      await deleteDoc(snapshot.docs[0].ref);
    }

    // Actualizar caché
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const data = raw ? JSON.parse(raw) : {};
    
    if (data[date] && data[date][mealType]) {
      delete data[date][mealType];
      if (Object.keys(data[date]).length === 0) {
        delete data[date];
      }
    }
    
    await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
}

// ============= PANTRY =============

export async function getPantry() {
  const user = getCurrentUser();
  
  // Sin usuario: AsyncStorage
  if (!user) {
    const raw = await AsyncStorage.getItem(PANTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  // Con usuario: Firestore
  try {
    const docRef = doc(db, 'pantries', user.uid);
    const docSnap = await getDoc(docRef);
    
    const items = docSnap.exists() ? docSnap.data().items || [] : [];
    await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
    return items;
  } catch (error) {
    console.warn('Error fetching pantry from Firestore, using cache:', error);
    const raw = await AsyncStorage.getItem(PANTRY_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function savePantry(items) {
  const user = getCurrentUser();
  
  // Sin usuario: AsyncStorage
  if (!user) {
    await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
    return;
  }

  // Con usuario: Firestore
  try {
    const docRef = doc(db, 'pantries', user.uid);
    await setDoc(docRef, {
      items,
      userId: user.uid,
      updatedAt: new Date(),
    });
    
    await AsyncStorage.setItem(PANTRY_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving pantry:', error);
    throw error;
  }
}