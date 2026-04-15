// Mock de NativeModules para compatibilidad con Node.js v22+
// jest-expo intenta hacer Object.defineProperty sobre este módulo
// pero en Node.js moderno puede ser no-extensible
module.exports = {
  default: {},
};
