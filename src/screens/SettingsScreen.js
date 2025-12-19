import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { getUserSettings, saveUserSettings } from '../storage/storage';
import { Logger } from '../utils/logger';

const MODULE = 'SettingsScreen';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      Logger.info(MODULE, 'Loading settings');
      const settings = await getUserSettings();
      setSelectedOption(settings.meal_count);
      Logger.info(MODULE, 'Settings loaded: ' + settings.meal_count + ' meals');
      setLoading(false);
    } catch (error) {
      Logger.error(MODULE, 'Failed to load settings', error.message);
      setLoading(false);
    }
  }

  async function handleSelectOption(option) {
    try {
      Logger.info(MODULE, 'Saving settings: ' + option.label);
      setSelectedOption(option.id);
      await saveUserSettings({
        meal_count: option.id,
        meal_names: option.meals
      });
      Logger.info(MODULE, 'Settings saved: ' + option.label);
      setMessage('Configuracion actualizada a ' + option.label);
    } catch (error) {
      Logger.error(MODULE, 'Failed to save settings', error.message);
      setMessage('No se pudo guardar la configuracion');
    }
  }

  function showLogoutConfirmation() {
    setShowLogoutConfirm(true);
  }

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      Logger.info(MODULE, 'Starting logout');
      
      // Limpiar cache local
      await AsyncStorage.removeItem('mp_recipes_v1');
      await AsyncStorage.removeItem('mp_meals_v1');
      await AsyncStorage.removeItem('mp_pantry_v1');
      await AsyncStorage.removeItem('user_settings');
      Logger.info(MODULE, 'Cache cleared');
      
      // Cerrar sesion en Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        Logger.error(MODULE, 'Logout failed', error.message);
        setMessage('Error: ' + (error.message || 'No se pudo cerrar sesion'));
        setShowLogoutConfirm(false);
        setLoggingOut(false);
        return;
      }
      
      Logger.info(MODULE, 'Logout successful');
      setShowLogoutConfirm(false);
      // La navegacion se manejara automaticamente a traves del onAuthStateChange en App.js
    } catch (error) {
      Logger.error(MODULE, 'Logout exception', error.message);
      setMessage('Error: ' + (error?.message || 'Algo salio mal al cerrar sesion'));
      setShowLogoutConfirm(false);
      setLoggingOut(false);
    }
  }

  function cancelLogout() {
    setShowLogoutConfirm(false);
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
          onPress={showLogoutConfirmation}
        >
          <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {message ? (
        <View style={[
          styles.messageBox,
          message.includes('✓') ? styles.messageSuccess : styles.messageError
        ]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cerrar Sesión</Text>
            <Text style={styles.modalMessage}>¿Deseas cerrar sesión?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={cancelLogout}
                disabled={loggingOut}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonConfirm, loggingOut && styles.modalButtonDisabled]}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                <Text style={styles.modalButtonConfirmText}>
                  {loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  messageBox: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16
  },
  messageSuccess: {
    backgroundColor: '#d4edda',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745'
  },
  messageError: {
    backgroundColor: '#f8d7da',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545'
  },
  messageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  modalButtonCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#f0f0f0'
  },
  modalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  modalButtonConfirm: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#E74C3C'
  },
  modalButtonConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  modalButtonDisabled: {
    opacity: 0.6
  }
});
