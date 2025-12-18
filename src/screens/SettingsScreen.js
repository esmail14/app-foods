import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import { getUserSettings, saveUserSettings } from '../storage/storage';

const PRESET_OPTIONS = [
  {
    id: 2,
    label: '2 comidas',
    meals: ['Desayuno', 'Almuerzo']
  },
  {
    id: 3,
    label: '3 comidas (recomendado)',
    meals: ['Desayuno', 'Almuerzo', 'Cena']
  },
  {
    id: 4,
    label: '4 comidas',
    meals: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']
  }
];

export default function SettingsScreen({ navigation }) {
  const [selectedOption, setSelectedOption] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const settings = await getUserSettings();
      setSelectedOption(settings.meal_count);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setLoading(false);
    }
  }

  async function handleSelectOption(option) {
    try {
      setSelectedOption(option.id);
      await saveUserSettings({
        meal_count: option.id,
        meal_names: option.meals
      });
      Alert.alert('✓ Guardado', `Configuración actualizada a ${option.label}`);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  }

  async function handleLogout() {
    Alert.alert('Cerrar Sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar' },
      {
        text: 'Cerrar Sesión',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', error?.message || 'No se pudo cerrar sesión');
          }
        }
      }
    ]);
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Configuración</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comidas por día</Text>
        <Text style={styles.sectionDescription}>
          Elige cuántas comidas deseas planificar cada día
        </Text>

        {PRESET_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedOption === option.id && styles.optionButtonSelected
            ]}
            onPress={() => handleSelectOption(option)}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                selectedOption === option.id && styles.optionLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionMeals,
                selectedOption === option.id && styles.optionMealsSelected
              ]}>
                {option.meals.join(', ')}
              </Text>
            </View>
            {selectedOption === option.id && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { marginTop: 40 }]}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    paddingTop: 12
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700'
  },
  section: {
    padding: 16,
    marginVertical: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  optionButtonSelected: {
    borderColor: '#FF6B6B',
    backgroundColor: '#fff5f5'
  },
  optionContent: {
    flex: 1
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  optionLabelSelected: {
    color: '#FF6B6B'
  },
  optionMeals: {
    fontSize: 13,
    color: '#999'
  },
  optionMealsSelected: {
    color: '#FF6B6B'
  },
  checkmark: {
    fontSize: 20,
    color: '#FF6B6B',
    fontWeight: 'bold'
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
