/**
 * Logger with File Persistence
 * Saves all logs to AsyncStorage for debugging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MIN_LOG_LEVEL = IS_PRODUCTION ? LOG_LEVELS.WARN : LOG_LEVELS.DEBUG;
const LOGS_STORAGE_KEY = 'app_logs_v1';
const MAX_LOGS = 1000; // Rotate after 1000 logs

function getFullTimestamp() {
  const now = new Date();
  return now.toISOString();
}

async function saveLog(logEntry) {
  try {
    const existing = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
    let logs = existing ? JSON.parse(existing) : [];
    
    logs.push(logEntry);
    
    // Rotate if too many logs
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(-500); // Keep last 500 logs
    }
    
    await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error('Failed to save log:', error);
  }
}

function log(level, module, message, data = null) {
  if (LOG_LEVELS[level] < MIN_LOG_LEVEL) return;

  const fullTime = getFullTimestamp();

  // Save to file (no console output)
  const logEntry = {
    timestamp: fullTime,
    level,
    module,
    message,
    data: data || null,
  };
  
  saveLog(logEntry);
}

export const Logger = {
  debug: (module, message, data) => log('DEBUG', module, message, data),
  info: (module, message, data) => log('INFO', module, message, data),
  warn: (module, message, data) => log('WARN', module, message, data),
  error: (module, message, data) => log('ERROR', module, message, data),

  async getLogs() {
    try {
      const logs = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  },

  async clearLogs() {
    try {
      await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
      console.log('Logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  },

  async exportLogs() {
    try {
      const logs = await this.getLogs();
      const csv = logs.map(log => 
        `${log.timestamp}|${log.level}|${log.module}|${log.message}|${log.data ? JSON.stringify(log.data) : ''}`
      ).join('\n');
      
      const header = 'Timestamp|Level|Module|Message|Data\n';
      return header + csv;
    } catch (error) {
      console.error('Failed to export logs:', error);
      return '';
    }
  },
};

export default Logger;
