import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MealCell({ meal, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.cell}>
      <View style={styles.content}>
        <View>
          <Text style={styles.mealType}>{meal?.mealType || '—'}</Text>
          <Text style={styles.recipeName}>{meal?.recipeName ?? 'Asignar receta'}</Text>
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
  content: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealType: { fontSize: 11, color: '#666', textTransform: 'uppercase', fontWeight: '600' },
  recipeName: { fontSize: 15, fontWeight: '500', marginTop: 4, color: '#222' },
  chevron: { fontSize: 24, color: '#ccc', fontWeight: '300' }
});