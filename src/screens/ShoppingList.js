import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getMealsForWeek, getAllRecipes, getPantry } from '../storage/storage';
import { aggregateIngredients, subtractPantry } from '../utils/ingredients';
import { Logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'ShoppingList';

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 1;
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      Logger.info(MODULE, 'Loading shopping list');
      const start = startOfWeek();
      const mealsByDate = await getMealsForWeek(start);
      
      // collect all recipes used
      const recipes = await getAllRecipes();
      
      // build array of ingredients from meals
      let allIngredients = [];
      Object.keys(mealsByDate).forEach(date => {
        const meals = mealsByDate[date];
        Object.keys(meals || {}).forEach(mt => {
          const m = meals[mt];
          if (m?.ingredients) {
            allIngredients = allIngredients.concat(m.ingredients);
          }
        });
      });
      
      // Validar que haya ingredientes
      if (allIngredients.length === 0) {
        Logger.info(MODULE, 'No ingredients found for shopping list');
        setItems([]);
        setLoading(false);
        return;
      }
      
      const aggregated = aggregateIngredients(allIngredients);
      const pantry = await getPantry();
      const final = subtractPantry(aggregated, pantry);
      Logger.info(MODULE, 'Shopping list loaded: ' + final.length + ' items');
      setItems(final);
      setLoading(false);
    } catch (error) {
      Logger.error(MODULE, 'Failed to load shopping list', error.message);
      Alert.alert('❌ Error', 'No se pudo cargar la lista de compra');
      console.error('Error loading shopping list:', error);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Cargando lista..." />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lista de la Compra</Text>
        <Text style={styles.subtitle}>Semana actual</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.name + (it.unit||'')}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowIcon}>✓</Text>
              <View style={styles.rowText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.totalAmount ?? '?'} {item.unit ?? ''}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Sin items para comprar</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <TouchableOpacity style={styles.refreshBtn} onPress={load}>
        <Text style={styles.refreshIcon}>🔄</Text>
        <Text style={styles.refreshBtnText}>Refrescar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#9B59B6', paddingHorizontal: 16, paddingVertical: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#e0e0e0', fontSize: 12, marginTop: 4 },
  row: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { fontSize: 18, color: '#4ECDC4', fontWeight: 'bold' },
  rowText: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#222' },
  itemQty: { fontSize: 13, color: '#999', marginTop: 2 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 12 },
  refreshBtn: { backgroundColor: '#9B59B6', marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  refreshIcon: { fontSize: 18 },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});