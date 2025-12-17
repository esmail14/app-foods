```markdown
# Meal Planner - Expo (MVP offline)

Aplicación móvil simple hecha con Expo para planificar las comidas de la semana,
gestionar recetas (con ingredientes) y generar una lista de la compra consolidada.

Características:
- Vista semanal (almuerzo, comida, cena) y asignación de recetas a cada comida.
- CRUD básico de recetas (nombre y lista de ingredientes).
- Pantrý (despensa) simple para restar lo que ya tienes.
- Generación de lista de la compra a partir de las comidas de la semana, agrupando cantidades.
- Datos guardados localmente con AsyncStorage (offline-first).

Requisitos:
- Node.js (v16+ recomendado)
- Expo CLI (`npm install -g expo-cli`) o usar `npx expo`

Cómo ejecutar:
1. Clona o copia el proyecto en una carpeta local.
2. Instala dependencias:
   npm install
3. Inicia Expo:
   npx expo start
4. Abre en un emulador o en tu teléfono con la app Expo Go.

Notas:
- La app usa AsyncStorage; al desinstalar la app o limpiar datos se perderá la información local.
- Si deseas añadir sincronización en la nube (Firebase / Supabase), puedo preparar los cambios.
```