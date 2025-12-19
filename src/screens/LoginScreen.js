import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'LoginScreen';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setErrorMessage('');

    // Validaciones
    if (!email || !password) {
      Logger.warn(MODULE, 'Login attempt with missing credentials');
      setErrorMessage('Por favor completa email y contraseña');
      return;
    }

    if (!validateEmail(email)) {
      Logger.warn(MODULE, 'Invalid email format', email);
      setErrorMessage('Email inválido. Debe tener formato: usuario@dominio.com');
      return;
    }

    if (password.length < 6) {
      Logger.warn(MODULE, 'Password too short');
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      Logger.info(MODULE, 'Login attempt for: ' + email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Logger.error(MODULE, 'Login failed', error.message);
        const userMsg = ErrorHandler.getUserMessage(error);
        setErrorMessage(userMsg.description);
      } else {
        Logger.info(MODULE, 'Login successful for: ' + email);
        navigation.replace('WeekView');
      }
    } catch (error) {
      Logger.error(MODULE, 'Login exception', error.message);
      const userMsg = ErrorHandler.getUserMessage(error);
      setErrorMessage(userMsg.description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Iniciando sesión..." />
      
      {errorMessage ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}
      
      <Text style={styles.title}>Iniciar Sesión</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        editable={!loading}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate aquí</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  errorToast: {
    backgroundColor: '#E74C3C',
    padding: 14,
    paddingTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  errorToastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});
