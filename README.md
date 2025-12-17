# 🍽️ Meal Planner MVP

Una aplicación web y móvil para planificar comidas semanales de manera fácil y eficiente.

## 🚀 Características

- ✅ **Crear recetas**: Agrega ingredientes con cantidades y unidades
- ✅ **Planificar semana**: Asigna recetas a días y tipos de comida
- ✅ **Lista de compras**: Genera automáticamente la lista de ingredientes necesarios
- ✅ **Buscar**: Encuentra recetas por nombre o ingredientes
- ✅ **Editar/Eliminar**: Modifica tus comidas con un long-press
- ✅ **Pantry**: Gestiona los ingredientes que tienes en casa
- ✅ **PWA**: Funciona como app web instalable en el iPhone

## 🌐 Acceso Online

Versión desplegada en Vercel:
👉 **https://app-foods-neon.vercel.app**

### Instalar en iPhone (PWA)
1. Abre el enlace en **Safari**
2. Toca el botón **Compartir** (↑)
3. Selecciona **"Agregar a pantalla de inicio"**
4. ¡Listo! Tendrás la app en tu pantalla de inicio

## 💻 Ejecutar en local

### Requisitos
- Node.js 16+ 
- npm o yarn

### Instalación

\\\ash
# Clonar repositorio
git clone https://github.com/esmail14/app-foods.git
cd app-foods

# Instalar dependencias
npm install --legacy-peer-deps
\\\

### Desarrollo (Web)

\\\ash
# Inicia el servidor web en http://localhost:19006
npm run web
\\\

### Desarrollo (Móvil con Expo Go)

\\\ash
# Inicia servidor para dispositivos móviles
npx expo start

# Escanea el QR con:
# - Expo Go (iOS/Android)
# - Camera app (iOS)
\\\

## 📁 Estructura del Proyecto

\\\
src/
├── components/
│   └── MealCell.js          # Celda individual de comida
├── screens/
│   ├── RecipeList.js        # Lista de recetas
│   ├── RecipeEditor.js      # Crear/editar receta
│   ├── WeekView.js          # Planificador semanal
│   ├── ShoppingList.js      # Lista de compras
│   └── Pantry.js            # Pantry management
├── storage/
│   └── storage.js           # AsyncStorage wrapper
└── utils/
    └── ingredients.js       # Utilidades de ingredientes
\\\

## 🛠 Tecnologías

- **React Native** 0.74.5
- **Expo** 54.0.0
- **React Navigation** 6.1.6
- **AsyncStorage** 1.23.1
- **React Native Web** 0.19.13

## 📦 Versión Actual

**v1.0.0-stable** - MVP completo con todas las features funcionales

### Cambios en v1.0.0:
- ✅ Modal de confirmación para eliminar comidas (web compatible)
- ✅ Long-press funcional en web (onPressIn/onPressOut + setTimeout)
- ✅ Web deployment en Vercel
- ✅ PWA con manifest y service worker
- ✅ Webpack-dev-server actualizado para mejor estabilidad

## 🐛 Problemas Conocidos

Ninguno en esta versión estable.

## 📝 Licencia

MIT

## 👤 Autor

Juan Antonio Ordóñez
