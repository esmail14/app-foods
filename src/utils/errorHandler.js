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

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return ERROR_TYPES.NETWORK;
  }

  if (message.includes('auth') || message.includes('unauthorized') || code === 'invalid_grant') {
    return ERROR_TYPES.AUTH;
  }

  if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return ERROR_TYPES.VALIDATION;
  }

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
      userMessage: ERROR_MESSAGES[type],
    };
  },

  getUserMessage(error) {
    const type = classifyError(error);
    return ERROR_MESSAGES[type] || ERROR_MESSAGES[ERROR_TYPES.UNKNOWN];
  },
};

export default ErrorHandler;
