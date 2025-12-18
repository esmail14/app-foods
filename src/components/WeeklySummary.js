import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WeeklySummary({ summary }) {
  const { assigned, total, ingredients, completeDays, totalDays } = summary;
  const isComplete = completeDays === totalDays;

  return (
    <View style={[styles.container, isComplete ? styles.complete : styles.incomplete]}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{assigned}/{total}</Text>
        <Text style={styles.statLabel}>Recetas</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{ingredients}</Text>
        <Text style={styles.statLabel}>Ingredientes</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.statValue}>{completeDays}/{totalDays}</Text>
        <Text style={styles.statLabel}>Días completos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  complete: {
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  incomplete: {
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
