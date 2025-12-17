import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Button, Alert, ScrollView } from 'react-native';
import { getMealsForWeek, saveMeal } from '../storage/storage';
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
        // Mostrar confirmación antes de guardar
        const mealTypeLabel = mealType === 'desayuno' ? '🌅 Desayuno' : 
                              mealType === 'almuerzo' ? '🍽 Almuerzo' : 
                              '🌙 Cena';
        
        Alert.alert(
          '✅ Confirmar',
          `¿Asignar "${recipe.name}" como ${mealTypeLabel}?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              onPress: async () => {
                await saveMeal({ 
                  date: dateStr, 
                  mealType, 
                  recipeId: recipe.id, 
                  recipeName: recipe.name, 
                  ingredients: recipe.ingredients 
                });
                load();
              }
            }
          ]
        );
      }
    });
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
  actionBtnIcon: { fontSize: 20 }
});