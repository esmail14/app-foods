import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, Picker } from 'react-native';
import { saveRecipe, getAllRecipes, deleteRecipe as storageDelete } from '../storage/storage';
import { Logger } from '../utils/logger';

const MODULE = 'RecipeEditor';

export default function RecipeEditor({ navigation, route }) {
  const editing = route.params?.recipe;
  const [name, setName] = useState(editing?.name ?? '');
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientAmount, setIngredientAmount] = useState('');
  const [ingredientUnit, setIngredientUnit] = useState('');
  const [ingredients, setIngredients] = useState(editing?.ingredients ?? []);
  const [editingIngredientIdx, setEditingIngredientIdx] = useState(null);
  const [message, setMessage] = useState('');

  const units = ['', 'g', 'kg', 'ml', 'l', 'taza', 'cucharada', 'cucharadita', 'unidad', 'paquete'];

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar receta' : 'Nueva receta' });
  }, []);

  function addIngredient() {
    // Validar que haya nombre
    if (!ingredientName.trim()) {
      Logger.warn(MODULE, 'Attempted to add ingredient without name');
      setMessage('⚠️ Por favor ingresa un nombre de ingrediente');
      return;
    }

    // Validar que el nombre tenga solo letras, espacios, y algunos caracteres comunes
    if (!/^[a-záéíóúñ\s\-,\.()]+$/i.test(ingredientName.trim())) {
      Logger.warn(MODULE, 'Invalid ingredient name format', ingredientName);
      setMessage('⚠️ Solo se permiten letras, espacios y caracteres como (-,.)');
      return;
    }

    // Validar cantidad si existe
    if (ingredientAmount.trim() && isNaN(ingredientAmount)) {
      Logger.warn(MODULE, 'Invalid ingredient amount', ingredientAmount);
      setMessage('⚠️ La cantidad debe ser un número válido (ej: 2, 1.5)');
      return;
    }

    const newIngredient = {
      name: ingredientName.trim(),
      amount: ingredientAmount.trim() ? Number(ingredientAmount) : null,
      unit: ingredientUnit || ''
    };

    if (editingIngredientIdx !== null) {
      // Modo edición: actualizar ingrediente existente
      const updatedIngredients = [...ingredients];
      updatedIngredients[editingIngredientIdx] = newIngredient;
      setIngredients(updatedIngredients);
      setEditingIngredientIdx(null);
      Logger.info(MODULE, 'Ingredient updated', newIngredient.name);
      setMessage('✅ Cambios guardados');
    } else {
      // Modo agregar: validar duplicados
      const isDuplicate = ingredients.some(
        ing => ing.name.toLowerCase() === ingredientName.toLowerCase()
      );
      if (isDuplicate) {
        Logger.warn(MODULE, 'Duplicate ingredient attempted', ingredientName);
        setMessage(`⚠️ Ya existe "${ingredientName}" en los ingredientes`);
        return;
      }
      
      setIngredients([...ingredients, newIngredient]);
      Logger.info(MODULE, 'Ingredient added', newIngredient.name);
      setMessage('✅ Ingrediente agregado');
    }
    
    // Limpiar campos
    setIngredientName('');
    setIngredientAmount('');
    setIngredientUnit('');
  }

  function startEditingIngredient(idx) {
    const ingredient = ingredients[idx];
    setIngredientName(ingredient.name);
    setIngredientAmount(ingredient.amount ? String(ingredient.amount) : '');
    setIngredientUnit(ingredient.unit);
    setEditingIngredientIdx(idx);
  }

  function cancelEditing() {
    setIngredientName('');
    setIngredientAmount('');
    setIngredientUnit('');
    setEditingIngredientIdx(null);
  }

  async function save() {
    // Validar nombre
    if (!name.trim()) {
      Logger.warn(MODULE, 'Attempted to save recipe without name');
      setMessage('⚠️ Por favor ingresa un nombre para la receta');
      return;
    }

    // Validar ingredientes
    if (ingredients.length === 0) {
      Logger.warn(MODULE, 'Attempted to save recipe without ingredients');
      setMessage('⚠️ Por favor agrega al menos un ingrediente');
      return;
    }

    // Validar que los ingredientes sean válidos
    const invalidIngredients = ingredients.filter(ing => !ing.name || !ing.name.trim());
    if (invalidIngredients.length > 0) {
      Logger.warn(MODULE, 'Recipe has invalid ingredients');
      setMessage('⚠️ Todos los ingredientes deben tener un nombre');
      return;
    }

    // Guardar receta
    const recipeToSave = {
      id: editing?.id,
      name: name.trim(),
      ingredients: ingredients.map(ing => ({
        ...ing,
        name: ing.name.trim()
      }))
    };

    try {
      await saveRecipe(recipeToSave);
      Logger.info(MODULE, editing ? 'Recipe updated' : 'Recipe created', recipeToSave.name);
      setMessage(`✅ Receta "${recipeToSave.name}" guardada`);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      Logger.error(MODULE, 'Failed to save recipe', error.message);
      setMessage('Error al guardar la receta');
    }
  }

  async function removeIngredient(idx) {
    const copy = [...ingredients];
    copy.splice(idx,1);
    setIngredients(copy);
  }

  async function removeRecipe() {
    if (!editing) return;
    
    try {
      Logger.info(MODULE, 'Deleting recipe', editing.name);
      await storageDelete(editing.id);
      Logger.info(MODULE, 'Recipe deleted successfully', editing.name);
      setMessage(`✅ "${editing.name}" eliminada`);
      setTimeout(() => navigation.goBack(), 1500);
    } catch (error) {
      Logger.error(MODULE, 'Failed to delete recipe', error.message);
      setMessage('Error al eliminar la receta');
    }
  }

  return (
    <View style={styles.container}>
      {message ? (
        <View style={[styles.messageBox, message.includes('⚠️') ? styles.messageError : styles.messageSuccess]}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre de la receta</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="P. ej. Ensalada de atún" placeholderTextColor="#ccc" />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Agregar ingrediente</Text>
        <View style={styles.ingredientInputContainer}>
          <View style={styles.unitPickerContainer}>
            <Text style={styles.smallLabel}>Unidad</Text>
            <Picker
              selectedValue={ingredientUnit}
              onValueChange={setIngredientUnit}
              style={styles.unitPicker}
            >
              {units.map((unit, idx) => (
                <Picker.Item key={idx} label={unit || '-'} value={unit} />
              ))}
            </Picker>
          </View>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.smallLabel}>Cantidad</Text>
            <TextInput
              value={ingredientAmount}
              onChangeText={setIngredientAmount}
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
            />
          </View>
          
          <View style={styles.nameInputContainer}>
            <Text style={styles.smallLabel}>Ingrediente</Text>
            <TextInput
              value={ingredientName}
              onChangeText={setIngredientName}
              style={styles.nameInput}
              placeholder="Ej: tomate"
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
        
        <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
          <Text style={styles.addBtnIcon}>{editingIngredientIdx !== null ? '💾' : '➕'}</Text>
          <Text style={styles.addBtnText}>{editingIngredientIdx !== null ? 'Guardar cambios' : 'Agregar'}</Text>
        </TouchableOpacity>
        {editingIngredientIdx !== null && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditing}>
            <Text style={styles.cancelBtnIcon}>✕</Text>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Ingredientes</Text>
        <FlatList
          data={ingredients}
          keyExtractor={(_,i)=>String(i)}
          renderItem={({item,index}) => (
            <View style={styles.ingredientRow}>
              <TouchableOpacity 
                style={styles.ingredientContent}
                onPress={() => startEditingIngredient(index)}
              >
                <Text style={[styles.ingredientText, editingIngredientIdx === index && styles.ingredientTextEditing]}>
                  {item.amount ? `${item.amount}` : '?'} {item.unit ? `${item.unit}` : ''} {item.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.saveBtn} onPress={save}>
          <Text style={styles.saveBtnIcon}>💾</Text>
          <Text style={styles.saveBtnText}>Guardar</Text>
        </TouchableOpacity>
        {editing ? 
          <TouchableOpacity style={styles.deleteRecipeBtn} onPress={removeRecipe}>
            <Text style={styles.deleteBtnIcon}>🗑️</Text>
            <Text style={styles.deleteBtnText}>Eliminar</Text>
          </TouchableOpacity>
        : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 12 },
  section: { backgroundColor: '#fff', marginBottom: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8, textTransform: 'uppercase' },
  smallLabel: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginVertical: 0, borderRadius: 6, color: '#333', fontSize: 14 },
  ingredientInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  unitPickerContainer: { flex: 0.8 },
  unitPicker: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, height: 40, backgroundColor: '#f9f9f9' },
  amountInputContainer: { flex: 0.8 },
  amountInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, color: '#333', fontSize: 14 },
  nameInputContainer: { flex: 1.4 },
  nameInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, color: '#333', fontSize: 14 },
  addBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 10, borderRadius: 6, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  addBtnIcon: { fontSize: 18 },
  cancelBtn: { backgroundColor: '#95a5a6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 10, borderRadius: 6, marginTop: 6 },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtnIcon: { fontSize: 18 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  ingredientContent: { flex: 1, paddingRight: 10 },
  ingredientText: { color: '#333', fontSize: 14 },
  ingredientTextEditing: { color: '#4ECDC4', fontWeight: '600', backgroundColor: '#f0f9f8', padding: 4, borderRadius: 4 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18, color: '#FF6B6B' },
  buttons: { flexDirection: 'column', gap: 8, marginTop: 12 },
  saveBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveBtnIcon: { fontSize: 18 },
  deleteRecipeBtn: { backgroundColor: '#FF6B6B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtnIcon: { fontSize: 18 },
  messageBox: { padding: 12, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  messageError: { backgroundColor: '#fff3cd', borderLeftWidth: 4, borderLeftColor: '#ffc107' },
  messageSuccess: { backgroundColor: '#d4edda', borderLeftWidth: 4, borderLeftColor: '#28a745' },
  messageText: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1 }
});