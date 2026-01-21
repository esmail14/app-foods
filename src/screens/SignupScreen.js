import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../supabase';
import { Logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'SignupScreen';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleSignup = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validaciones
    if (!email || !password || !confirmPassword) {
      Logger.warn(MODULE, 'Signup attempt with missing fields');
      setErrorMessage('Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Logger.warn(MODULE, 'Invalid email format', email);
      setErrorMessage('Email inválido. Debe tener formato: usuario@dominio.com');
      return;
    }

    if (!validatePassword(password)) {
      Logger.warn(MODULE, 'Password too short');
      setErrorMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Logger.warn(MODULE, 'Passwords do not match');
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      Logger.info(MODULE, 'Signup attempt for: ' + email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Logger.error(MODULE, 'Signup failed', error.message);
        const userMsg = ErrorHandler.getUserMessage(error);
        setErrorMessage(userMsg.description);
      } else {
        Logger.info(MODULE, 'Signup successful for: ' + email);
        setSuccessMessage('Cuenta creada exitosamente. Redirigiendo...');
        setTimeout(() => {
          navigation.replace('Login');
        }, 2000);
      }
    } catch (error) {
      Logger.error(MODULE, 'Signup exception', error.message);
      const userMsg = ErrorHandler.getUserMessage(error);
      setErrorMessage(userMsg.description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Creando cuenta..." />
      
      {errorMessage ? (
        <View style={styles.errorToast}>
          <Text style={styles.errorToastText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successToast}>
          <Text style={styles.successToastText}>✓ {successMessage}</Text>
        </View>
      ) : null}
      
      <Text style={styles.title}>Crear Cuenta</Text>
      
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
        placeholder="Contraseña (mín. 6 caracteres)"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirmar Contraseña"
        placeholderTextColor="#999"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Crear Cuenta'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
        <Text style={styles.link}>¿Ya tienes cuenta? Inicia sesión aquí</Text>
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
  successToast: {
    backgroundColor: '#27AE60',
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
  successToastText: {
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
