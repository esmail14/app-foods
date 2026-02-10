# 📝 Cambios Realizados - Mejoras 2.3.0

## ✅ 1. Agregar Instrucciones y Fotos a Recetas

### Cambios en `src/storage/storage.js`:
- **`getAllRecipes()`**: Ahora retorna `instructions` y `photoUri` de cada receta
- **`saveRecipe()`**: Guarda `instructions` y `photo_uri` en la base de datos Supabase

### Cambios en `src/screens/RecipeEditor.js`:
- **Nuevos campos de entrada**:
  - Input de texto multilínea para instrucciones
  - Selector de foto con preview
- **Nuevas funciones**:
  - `pickPhoto()`: Abre el selector de imágenes
  - `removePhoto()`: Elimina la foto seleccionada
- **Nuevos estilos**:
  - `instructionsInput`: Entrada de instrucciones
  - `photoContainer`, `photoPreview`, `removePhotoBtn`: Estilos para visualizar y eliminar foto
  - `photoBtn`, `photoBtnIcon`, `photoBtnText`: Botón para seleccionar foto

### Nueva dependencia:
- `expo-image-picker` ~14.7.1 (para seleccionar imágenes)

---

## ✅ 2. Editar Ingredientes en la Lista de Compras

### Cambios en `src/storage/storage.js`:
- **Nueva key**: `SHOPPING_LIST_MODIFICATIONS_KEY` para almacenar cambios locales
- **Nuevas funciones**:
  - `getShoppingListModifications()`: Obtiene las modificaciones guardadas
  - `modifyShoppingListItem()`: Guarda cambios (cantidad modificada o eliminado)
  - `clearShoppingListModifications()`: Restaura la lista a su estado original

### Cambios en `src/screens/ShoppingList.js`:
- **Nuevos estados**:
  - `editingItem`: Ingrediente siendo editado
  - `editAmount`: Nueva cantidad
  - `modifications`: Cambios aplicados a la lista

- **Nuevas funciones**:
  - `handleDeleteItem()`: Elimina un ingrediente de la lista
  - `handleEditAmount()`: Abre modal para editar cantidad
  - `saveEditAmount()`: Guarda la cantidad editada
  - `resetList()`: Restaura la lista a su estado original

- **Nuevos componentes**:
  - Modal para editar cantidades
  - Botón de eliminar (✕) en cada item
  - Botón "Restaurar" para deshacer cambios

- **Nuevos estilos**:
  - Estilos del modal (`modalOverlay`, `modalContent`, `modalInput`, etc.)
  - Estilos para botones (`deleteBtn`, `resetBtn`, `bottomButtons`)

---

## 🎯 Cómo Usar las Nuevas Características

### Agregar Instrucciones y Fotos a una Receta:
1. Ir a **Recetas** → **Agregar nueva receta** (o editar una existente)
2. Rellenar nombre
3. **NUEVO**: Escribir instrucciones en el campo de "Instrucciones"
4. **NUEVO**: Tocar "📷 Seleccionar foto" para agregar una imagen
5. Agregar ingredientes
6. Guardar

### Modificar Ingredientes en la Lista de Compras:
1. Ir a **Lista de la Compra**
2. **Tocar un ingrediente** para editar su cantidad
3. Ingresar la nueva cantidad (o 0 para eliminar)
4. Guardar cambios
5. **Tocar ✕** para eliminar rápidamente un ingrediente
6. **Tocar "↩️ Restaurar"** para deshacer todos los cambios

---

## 📦 Dependencias Agregadas:
- `expo-image-picker@~14.7.1`: Selector de imágenes nativo

---

## ⚠️ Próximos Pasos Recomendados:
1. Migrar base de datos Supabase para agregar columnas:
   - `instructions` (text)
   - `photo_uri` (text)
2. Testear en web y móvil
3. Validar que las fotos se persistan correctamente
4. Considerar comprimir imágenes para mejor performance

---

## 📊 Versión Actualizada:
- De: 2.2.0
- A: 2.3.0 (cuando se publique)
