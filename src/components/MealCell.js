import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MealCell({ meal, onPress }) {
  const hasRecipe = !!meal?.recipeName;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.cell, hasRecipe && styles.cellAssigned]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.mealType}>{meal?.mealType || '—'}</Text>
            {hasRecipe && <Text style={styles.badge}>✓</Text>}
          </View>
          <Text style={[styles.recipeName, hasRecipe ? styles.recipeNameAssigned : styles.recipeNameEmpty]}>
            {meal?.recipeName ?? 'Asignar receta'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: { 
    padding: 12, 
    backgroundColor: '#fff', 
    marginVertical: 6, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1
  },
  cellAssigned: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac'
  },
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealType: { fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: '600' },
  badge: { fontSize: 14, color: '#22c55e', fontWeight: '700' },
  recipeName: { fontSize: 15, fontWeight: '500', marginTop: 4 },
  recipeNameAssigned: { color: '#15803d', fontWeight: '600' },
  recipeNameEmpty: { color: '#999', fontStyle: 'italic' },
  chevron: { fontSize: 24, color: '#ccc', fontWeight: '300' }
});