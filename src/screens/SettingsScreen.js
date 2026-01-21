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
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

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

  async function handleOpenLogs() {
    setLogsLoading(true);
    try {
      const allLogs = await Logger.getLogs();
      setLogs(allLogs || []);
      setShowLogsModal(true);
    } catch (error) {
      Logger.error(MODULE, 'Failed to load logs', error.message);
      setMessage('Error al cargar los logs');
    } finally {
      setLogsLoading(false);
    }
  }

  async function handleExportLogs() {
    try {
      const csv = await Logger.exportLogs();
      setMessage('Logs exportados a CSV (revisar consola)');
      console.log('CSV Export:', csv);
    } catch (error) {
      Logger.error(MODULE, 'Failed to export logs', error.message);
      setMessage('Error al exportar logs');
    }
  }

  async function handleClearLogs() {
    try {
      await Logger.clearLogs();
      setLogs([]);
      setShowLogsModal(false);
      setMessage('Logs eliminados');
    } catch (error) {
      Logger.error(MODULE, 'Failed to clear logs', error.message);
      setMessage('Error al limpiar logs');
    }
  }

  function closeLogs() {
    setShowLogsModal(false);
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
          style={styles.logsButton}
          onPress={handleOpenLogs}
        >
          <Text style={styles.logsButtonText}>📋 Ver Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { marginTop: 0 }]}>
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

      <Modal
        visible={showLogsModal}
        transparent
        animationType="slide"
        onRequestClose={closeLogs}
      >
        <View style={styles.logsModalContainer}>
          <View style={styles.logsModalContent}>
            <View style={styles.logsModalHeader}>
              <Text style={styles.logsModalTitle}>📋 Logs ({logs.length})</Text>
              <TouchableOpacity onPress={closeLogs}>
                <Text style={styles.logsModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {logsLoading ? (
              <Text style={styles.logsLoading}>Cargando logs...</Text>
            ) : logs.length === 0 ? (
              <Text style={styles.logsEmpty}>No hay logs disponibles</Text>
            ) : (
              <ScrollView style={styles.logsScroll}>
                {logs.map((log, index) => (
                  <View key={index} style={styles.logItem}>
                    <View style={styles.logHeader}>
                      <Text style={[
                        styles.logLevel,
                        log.level === 'ERROR' && styles.logLevelError,
                        log.level === 'WARN' && styles.logLevelWarn,
                        log.level === 'INFO' && styles.logLevelInfo,
                        log.level === 'DEBUG' && styles.logLevelDebug
                      ]}>
                        [{log.level}]
                      </Text>
                      <Text style={styles.logTime}>{log.timestamp}</Text>
                    </View>
                    <Text style={styles.logModule}>{log.module}</Text>
                    <Text style={styles.logMessage}>{log.message}</Text>
                    {log.data && (
                      <Text style={styles.logData}>Data: {log.data}</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.logsModalButtons}>
              <TouchableOpacity
                style={styles.logsExportButton}
                onPress={handleExportLogs}
              >
                <Text style={styles.logsExportButtonText}>📥 Exportar CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logsClearButton}
                onPress={handleClearLogs}
              >
                <Text style={styles.logsClearButtonText}>🗑️ Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logsCloseButton}
                onPress={closeLogs}
              >
                <Text style={styles.logsCloseButtonText}>Cerrar</Text>
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
  logsButton: {
    backgroundColor: '#3498DB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  logsButtonText: {
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
  },
  logsModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end'
  },
  logsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
    flexDirection: 'column'
  },
  logsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa'
  },
  logsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333'
  },
  logsModalClose: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
    width: 30,
    height: 30,
    textAlign: 'center',
    lineHeight: 30
  },
  logsScroll: {
    flex: 1,
    paddingHorizontal: 8
  },
  logItem: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB'
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  logLevel: {
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
    color: '#333'
  },
  logLevelError: {
    backgroundColor: '#ffcccc',
    color: '#E74C3C'
  },
  logLevelWarn: {
    backgroundColor: '#fff3cd',
    color: '#F39C12'
  },
  logLevelInfo: {
    backgroundColor: '#d1ecf1',
    color: '#3498DB'
  },
  logLevelDebug: {
    backgroundColor: '#e2e3e5',
    color: '#6c757d'
  },
  logTime: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace'
  },
  logModule: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginBottom: 3
  },
  logMessage: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16
  },
  logData: {
    fontSize: 10,
    color: '#999',
    fontFamily: 'monospace',
    marginTop: 4,
    fontStyle: 'italic'
  },
  logsEmpty: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
    color: '#999'
  },
  logsLoading: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 14,
    color: '#999'
  },
  logsModalButtons: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f8f9fa'
  },
  logsExportButton: {
    flex: 1,
    backgroundColor: '#27AE60',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  logsExportButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  logsClearButton: {
    flex: 1,
    backgroundColor: '#E74C3C',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  logsClearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  logsCloseButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  logsCloseButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  }
});
