import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Button, Alert, Modal } from 'react-native';
import { getMealsForWeek, saveMeal, deleteMeal, getUserSettings } from '../storage/storage';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../supabase';
import MealCell from '../components/MealCell';
import WeeklySummary from '../components/WeeklySummary';
import { Logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'WeekView';

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (dom)
  const diff = d.getDate() - day + 1; // empezar en lunes (1)
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}

export default function WeekView({ navigation }) {
  const [mealsByDate, setMealsByDate] = useState({});
  const [mealTypes, setMealTypes] = useState(['desayuno', 'almuerzo', 'cena']);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [viewMode, setViewMode] = useState('day'); // 'day' o 'week'
  const [loading, setLoading] = useState(false);
  const focused = useIsFocused();

  useEffect(() => {
    if (focused) {
      loadSettings();
      load();
    }
  }, [focused]);

  async function loadSettings() {
    try {
      Logger.info(MODULE, 'Loading meal settings');
      const settings = await getUserSettings();
      const mealTypesArray = settings.meal_names.map(m => m.toLowerCase());
      setMealTypes(mealTypesArray);
      Logger.info(MODULE, 'Settings loaded: ' + mealTypesArray.length + ' meal types');
    } catch (error) {
      Logger.error(MODULE, 'Failed to load settings', error.message);
      console.error('Error loading meal types:', error);
    }
  }

  async function load() {
    try {
      Logger.info(MODULE, 'Loading meals for week');
      const start = startOfWeek();
      const data = await getMealsForWeek(start);
      setMealsByDate(data);
      Logger.info(MODULE, 'Weekly meals loaded');
    } catch (error) {
      Logger.error(MODULE, 'Failed to load weekly meals', error.message);
    }
  }

  function getTodayString() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  }

  function getTodayDate() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function openRecipePicker(dateStr, mealType) {
    Logger.info(MODULE, 'Opening recipe picker', dateStr + ' - ' + mealType);
    navigation.navigate('Recipes', {
      pickFor: { date: dateStr, mealType },
      onPick: async (recipe) => {
        setLoading(true);
        try {
          Logger.info(MODULE, 'Recipe selected for meal', recipe.name);
          await saveMeal({ 
            date: dateStr, 
            mealType, 
            recipeId: recipe.id, 
            recipeName: recipe.name, 
            ingredients: recipe.ingredients 
          });
          Logger.info(MODULE, 'Meal saved', dateStr + ' - ' + mealType);
          await load();
        } finally {
          setLoading(false);
        }
      }
    });
  }

  function handleLongPress(dateStr, mealType) {
    const meal = mealsByDate[dateStr]?.[mealType];
    if (meal?.recipeName) {
      setSelectedMeal({ dateStr, mealType, meal });
      setShowOptionsModal(true);
    }
  }

  async function handleDeleteMeal() {
    if (!selectedMeal) return;
    setShowOptionsModal(false);
    setShowConfirmDelete(true);
  }

  async function confirmDelete() {
    if (!selectedMeal) return;
    setLoading(true);
    try {
      Logger.info(MODULE, 'Deleting meal', selectedMeal.dateStr + ' - ' + selectedMeal.mealType);
      await deleteMeal(selectedMeal.dateStr, selectedMeal.mealType);
      Logger.info(MODULE, 'Meal deleted successfully', selectedMeal.meal.recipeName);
      setShowConfirmDelete(false);
      setSelectedMeal(null);
      await load();
    } catch (error) {
      Logger.error(MODULE, 'Failed to delete meal', error.message);
      console.error('Error deleting meal:', error);
      Alert.alert('❌ Error', 'No se pudo eliminar la comida');
    } finally {
      setLoading(false);
    }
  }

  function handleEditMeal() {
    if (!selectedMeal) return;
    setShowOptionsModal(false);
    openRecipePicker(selectedMeal.dateStr, selectedMeal.mealType);
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', error?.message || 'No se pudo cerrar sesión');
    }
  }

  function renderDayLarge() {
    const today = getTodayDate();
    const todayStr = getTodayString();
    
    return (
      <View style={styles.dayLargeContainer}>
        <View style={styles.dayLargeHeader}>
          <View>
            <Text style={styles.dayLargeTitle}>
              {today.toLocaleDateString(undefined, { weekday: 'long' })}
            </Text>
            <Text style={styles.dayLargeDate}>
              {today.getDate()} {today.toLocaleDateString(undefined, { month: 'short' })} • Hoy
            </Text>
          </View>
          <TouchableOpacity style={styles.viewSwitchBtn} onPress={() => setViewMode('week')}>
            <Text style={styles.viewSwitchBtnText}>Ver semana</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mealsLargeContainer}>
          {mealTypes.map((mt) => (
            <MealCell
              key={mt}
              meal={mealsByDate[todayStr]?.[mt]}
              mealType={mt}
              onPress={() => openRecipePicker(todayStr, mt)}
              onLongPress={() => handleLongPress(todayStr, mt)}
            />
          ))}
        </View>
      </View>
    );
  }

  function renderDay(dayOffset) {
    let d = new Date();
    const monday = startOfWeek();
    d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0, 10);
    return (
      <View style={styles.day} key={dateStr}>
        <Text style={styles.dayTitle}>{d.toLocaleDateString(undefined, { weekday: 'short' })}</Text>
        {mealTypes.map((mt) => (
          <MealCell
            key={mt}
            meal={mealsByDate[dateStr]?.[mt]}
            mealType={mt}
            onPress={() => openRecipePicker(dateStr, mt)}
            onLongPress={() => handleLongPress(dateStr, mt)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Cargando..." />
      
      {viewMode === 'day' ? (
        <View style={styles.contentContainer}>
          {renderDayLarge()}
        </View>
      ) : (
        <View style={styles.weekViewContainer}>
          <FlatList
            data={[0, 1, 2, 3, 4, 5, 6]}
            keyExtractor={(i) => String(i)}
            renderItem={({ item }) => renderDay(item)}
            contentContainerStyle={{ paddingBottom: 80 }}
            ListHeaderComponent={
              <TouchableOpacity 
                style={styles.backToDay}
                onPress={() => setViewMode('day')}
              >
                <Text style={styles.backToDayText}>← Volver al día actual</Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ShoppingList')}>
          <Text style={styles.actionBtnIcon}>🛒</Text>
          <Text style={styles.actionBtnText}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Recipes')}>
          <Text style={styles.actionBtnIcon}>🍽</Text>
          <Text style={styles.actionBtnText}>Recetas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.actionBtnIcon}>⚙️</Text>
          <Text style={styles.actionBtnText}>Config</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de opciones para comidas asignadas */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opciones</Text>
            {selectedMeal && (
              <Text style={styles.modalRecipeName}>{selectedMeal.meal.recipeName}</Text>
            )}
            
            <TouchableOpacity style={styles.optionBtn} onPress={handleEditMeal}>
              <Text style={styles.optionIcon}>✏️</Text>
              <Text style={styles.optionText}>Cambiar receta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionBtn, styles.optionBtnDelete]} onPress={handleDeleteMeal}>
              <Text style={styles.optionIconDelete}>🗑️</Text>
              <Text style={styles.optionTextDelete}>Eliminar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionBtnCancel} onPress={() => setShowOptionsModal(false)}>
              <Text style={styles.optionTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <Modal
        visible={showConfirmDelete}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmDelete(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑️ Eliminar comida</Text>
            {selectedMeal && (
              <Text style={styles.confirmText}>
                ¿Estás seguro de que deseas eliminar "{selectedMeal.meal.recipeName}"?
              </Text>
            )}
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.confirmCancelBtn} 
                onPress={() => setShowConfirmDelete(false)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmDeleteBtn} 
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  contentContainer: { flex: 1, paddingBottom: 80 },
  weekViewContainer: { flex: 1 },
  day: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', marginVertical: 6, marginHorizontal: 12, borderRadius: 8 },
  dayTitle: { fontWeight: '700', marginBottom: 10, fontSize: 14, color: '#333', textTransform: 'uppercase' },
  dayLargeContainer: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  dayLargeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dayLargeTitle: { fontSize: 28, fontWeight: '700', color: '#333', textTransform: 'capitalize' },
  dayLargeDate: { fontSize: 14, color: '#666', marginTop: 4 },
  viewSwitchBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#f0f9f8', borderWidth: 1, borderColor: '#4ECDC4' },
  viewSwitchBtnText: { fontSize: 13, fontWeight: '600', color: '#4ECDC4' },
  mealsLargeContainer: { gap: 8 },
  backToDay: { paddingHorizontal: 12, paddingVertical: 14, backgroundColor: '#e8f4f3', borderBottomWidth: 2, borderBottomColor: '#4ECDC4', marginBottom: 8 },
  backToDayText: { color: '#4ECDC4', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 12, gap: 10, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  actionBtn: { flex: 1, backgroundColor: '#FF6B6B', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionBtnIcon: { fontSize: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  modalRecipeName: { fontSize: 14, color: '#666', marginBottom: 20, fontWeight: '600', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  confirmText: { fontSize: 14, color: '#666', marginBottom: 20, fontWeight: '500', paddingVertical: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 10 },
  optionBtnDelete: { backgroundColor: '#fee2e2' },
  optionIcon: { fontSize: 20 },
  optionIconDelete: { fontSize: 20 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  optionTextDelete: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  optionBtnCancel: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 10 },
  optionTextCancel: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'center' },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  confirmCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  confirmCancelText: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'center' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#DC2626' },
  confirmDeleteText: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' }
});