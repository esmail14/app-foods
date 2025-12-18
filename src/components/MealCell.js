import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MealCell({ meal, onPress, onLongPress, mealType }) {
  const hasRecipe = !!meal?.recipeName;
  const [pressTimeout, setPressTimeout] = useState(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  // Mapeo de colores por tipo de comida
  const getMealColor = () => {
    const typeNorm = mealType?.toLowerCase() || '';
    const colors = {
      desayuno: { bg: '#fffbeb', border: '#fcd34d', label: '#92400e' },
      almuerzo: { bg: '#fed7aa', border: '#fb923c', label: '#7c2d12' },
      cena: { bg: '#ddd6fe', border: '#c4b5fd', label: '#4c1d95' },
      comida: { bg: '#fed7aa', border: '#fb923c', label: '#7c2d12' },
      merienda: { bg: '#fecdd3', border: '#fb7185', label: '#831843' }
    };
    return colors[typeNorm] || { bg: '#f0fdf4', border: '#86efac', label: '#166534' };
  };

  const color = getMealColor();

  const handlePressIn = () => {
    if (hasRecipe && onLongPress) {
      const timeout = setTimeout(() => {
        setIsLongPressed(true);
        onLongPress();
      }, 500);
      setPressTimeout(timeout);
    }
  };

  const handlePressOut = () => {
    if (pressTimeout) {
      clearTimeout(pressTimeout);
      setPressTimeout(null);
    }
    setIsLongPressed(false);
  };

  const handlePress = () => {
    if (!isLongPressed && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.cell, { backgroundColor: color.bg, borderColor: color.border }]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.mealType, { color: color.label }]}>{mealType?.charAt(0).toUpperCase() + mealType?.slice(1)}</Text>
            {hasRecipe && <Text style={styles.badge}>✓</Text>}
          </View>
          <Text style={[styles.recipeName, hasRecipe ? styles.recipeNameAssigned : styles.recipeNameEmpty]}>
            {meal?.recipeName ?? 'Asignar receta'}
          </Text>
        </View>
        <View style={styles.rightSection}>
          {hasRecipe && (
            <Text style={styles.editIcon}>⋮</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cell: { 
    padding: 12, 
    backgroundColor: '#f0fdf4',
    marginVertical: 6, 
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#86efac',
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
  rightSection: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editIcon: { fontSize: 18, color: '#666', paddingHorizontal: 6 },
  chevron: { fontSize: 24, color: '#ccc', fontWeight: '300' }
});