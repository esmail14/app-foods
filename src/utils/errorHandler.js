/**
 * Simple Error Handler - Classify and handle errors
 */

import { Logger } from './logger';

export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  UNKNOWN: 'UNKNOWN',
};

const ERROR_MESSAGES = {
  NETWORK: {
    message: 'Problema de conexion',
    description: 'No se pudo conectar. Verifica tu conexion a internet.',
  },
  AUTH: {
    message: 'Error de autenticacion',
    description: 'Tu sesion expiro o no tienes permisos.',
  },
  VALIDATION: {
    message: 'Datos invalidos',
    description: 'Por favor revisa los datos que ingresaste.',
  },
  DATABASE: {
    message: 'Error en la base de datos',
    description: 'No se pudo guardar los cambios. Intenta de nuevo.',
  },
  UNKNOWN: {
    message: 'Algo salio mal',
    description: 'Ocurrio un error inesperado. Intenta de nuevo mas tarde.',
  },
};

function classifyError(error) {
  if (!error) return ERROR_TYPES.UNKNOWN;

  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return ERROR_TYPES.NETWORK;
  }

  // Auth errors (invalid_grant = invalid credentials, user not found, etc)
  if (message.includes('auth') || message.includes('unauthorized') || code === 'invalid_grant' ||
      message.includes('invalid login credentials') || message.includes('user not found') ||
      message.includes('email not confirmed') || message.includes('already registered')) {
    return ERROR_TYPES.AUTH;
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ERROR_TYPES.VALIDATION;
  }

  // Database errors
  if (message.includes('database') || message.includes('sql')) {
    return ERROR_TYPES.DATABASE;
  }

  return ERROR_TYPES.UNKNOWN;
}

export const ErrorHandler = {
  handle(error, module, operation = 'Operation') {
    const type = classifyError(error);
    Logger.error(module, `${operation} failed: ${error.message}`);
    return {
      type,
      message: error.message,
      userMessage: this.getDetailedMessage(error),
    };
  },

  getUserMessage(error) {
    return this.getDetailedMessage(error);
  },

  getDetailedMessage(error) {
    if (!error) return ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];

    const message = error.message?.toLowerCase() || '';

    // Specific auth messages
    if (message.includes('invalid login credentials')) {
      return {
        message: 'Credenciales inválidas',
        description: 'Email o contraseña incorrectos. Intenta de nuevo.',
      };
    }

    if (message.includes('user not found')) {
      return {
        message: 'Usuario no encontrado',
        description: 'No existe una cuenta con este email. Crear una nueva?',
      };
    }

    if (message.includes('already registered')) {
      return {
        message: 'Email ya registrado',
        description: 'Este email ya tiene una cuenta. Intenta iniciar sesión.',
      };
    }

    if (message.includes('email not confirmed')) {
      return {
        message: 'Email no confirmado',
        description: 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada.',
      };
    }

    if (message.includes('password too short')) {
      return {
        message: 'Contraseña débil',
        description: 'La contraseña debe tener al menos 6 caracteres.',
      };
    }

    if (message.includes('network')) {
      return {
        message: 'Problema de conexión',
        description: 'No se pudo conectar. Verifica tu conexión a internet.',
      };
    }

    // Fallback to type-based message
    const type = classifyError(error);
    return ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  }
};

export default ErrorHandler;
