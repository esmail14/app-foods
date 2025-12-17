import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Button, Alert, Modal } from 'react-native';
import { getMealsForWeek, saveMeal, deleteMeal } from '../storage/storage';
import { useIsFocused } from '@react-navigation/native';
import MealCell from '../components/MealCell';

const mealTypes = ['desayuno', 'almuerzo', 'cena']; // puedes cambiar nombres si prefieres

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
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const focused = useIsFocused();

  useEffect(() => {
    if (focused) load();
  }, [focused]);

  async function load() {
    const start = startOfWeek();
    const data = await getMealsForWeek(start);
    setMealsByDate(data);
  }

  function openRecipePicker(dateStr, mealType) {
    navigation.navigate('Recipes', {
      pickFor: { date: dateStr, mealType },
      onPick: async (recipe) => {
        await saveMeal({ 
          date: dateStr, 
          mealType, 
          recipeId: recipe.id, 
          recipeName: recipe.name, 
          ingredients: recipe.ingredients 
        });
        load();
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
    
    Alert.alert(
      '🗑️ Eliminar comida',
      `¿Eliminar "${selectedMeal.meal.recipeName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteMeal(selectedMeal.dateStr, selectedMeal.mealType);
            setShowOptionsModal(false);
            setSelectedMeal(null);
            load();
          }
        }
      ]
    );
  }

  function handleEditMeal() {
    if (!selectedMeal) return;
    setShowOptionsModal(false);
    openRecipePicker(selectedMeal.dateStr, selectedMeal.mealType);
  }

  function renderDay(dayOffset) {
    const date = new Date();
    const monday = startOfWeek();
    const d = new Date(monday);
    d.setDate(monday.getDate() + dayOffset);
    const dateStr = d.toISOString().slice(0,10);
    return (
      <View style={styles.day} key={dateStr}>
        <Text style={styles.dayTitle}>{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</Text>
        {mealTypes.map((mt) => (
          <MealCell
            key={mt}
            meal={mealsByDate[dateStr]?.[mt]}
            onPress={() => openRecipePicker(dateStr, mt)}
            onLongPress={() => handleLongPress(dateStr, mt)}
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Planificador de Comidas</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ShoppingList')}>
          <Text style={styles.actionBtnIcon}>🛒</Text>
          <Text style={styles.actionBtnText}>Lista</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Recipes')}>
          <Text style={styles.actionBtnIcon}>🍽</Text>
          <Text style={styles.actionBtnText}>Recetas</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={[0,1,2,3,4,5,6]}
        keyExtractor={(i) => String(i)}
        renderItem={({item}) => renderDay(item)}
        contentContainerStyle={{paddingBottom: 80}}
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#FF6B6B', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  day: { paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', marginVertical: 6, marginHorizontal: 12, borderRadius: 8 },
  dayTitle: { fontWeight: '700', marginBottom: 10, fontSize: 14, color: '#333', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#FF6B6B', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  actionBtnIcon: { fontSize: 20 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  modalRecipeName: { fontSize: 14, color: '#666', marginBottom: 20, fontWeight: '600', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 8, marginBottom: 10 },
  optionBtnDelete: { backgroundColor: '#fee2e2' },
  optionIcon: { fontSize: 20 },
  optionIconDelete: { fontSize: 20 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#333' },
  optionTextDelete: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  optionBtnCancel: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginTop: 10 },
  optionTextCancel: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'center' }
});