// Patch para compatibilidad con Node.js v22+
// jest-expo setup.js intenta hacer Object.defineProperty sobre NativeModules
// que puede ser no-extensible en versiones recientes de Node.js
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function (obj, prop, descriptor) {
  try {
    return originalDefineProperty(obj, prop, descriptor);
  } catch {
    // Ignorar silenciosamente si el objeto no es extensible (entornos de test)
  }
};
