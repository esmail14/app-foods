import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { saveRecipe, getAllRecipes, deleteRecipe as storageDelete } from '../storage/storage';
import { parseIngredientLine } from '../utils/ingredients';

export default function RecipeEditor({ navigation, route }) {
  const editing = route.params?.recipe;
  const [name, setName] = useState(editing?.name ?? '');
  const [ingredientLine, setIngredientLine] = useState('');
  const [ingredients, setIngredients] = useState(editing?.ingredients ?? []);

  useEffect(() => {
    navigation.setOptions({ title: editing ? 'Editar receta' : 'Nueva receta' });
  }, []);

  function addIngredient() {
    // Validar que haya algo escrito
    if (!ingredientLine.trim()) {
      Alert.alert('⚠️ Campo vacío', 'Por favor ingresa un ingrediente');
      return;
    }

    const parsed = parseIngredientLine(ingredientLine);
    if (!parsed) {
      Alert.alert('❌ Formato inválido', 'Ejemplos válidos:\n"2 kg patata"\n"1 tomate"\n"sal"\n"3 cucharadas de azúcar"');
      return;
    }

    // Validar que no sea un ingrediente duplicado
    const isDuplicate = ingredients.some(
      ing => ing.name.toLowerCase() === parsed.name.toLowerCase()
    );
    if (isDuplicate) {
      Alert.alert('⚠️ Duplicado', `Ya agregaste "${parsed.name}" a los ingredientes`);
      return;
    }

    setIngredients([...ingredients, parsed]);
    setIngredientLine('');
  }

  async function save() {
    // Validar nombre
    if (!name.trim()) {
      Alert.alert('⚠️ Error', 'Por favor ingresa un nombre para la receta');
      return;
    }

    // Validar ingredientes
    if (ingredients.length === 0) {
      Alert.alert('⚠️ Error', 'Por favor agrega al menos un ingrediente');
      return;
    }

    // Validar que los ingredientes sean válidos
    const invalidIngredients = ingredients.filter(ing => !ing.name || !ing.name.trim());
    if (invalidIngredients.length > 0) {
      Alert.alert('⚠️ Error', 'Todos los ingredientes deben tener un nombre');
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

    await saveRecipe(recipeToSave);
    Alert.alert('✅ Éxito', `Receta "${recipeToSave.name}" guardada correctamente`);
    navigation.goBack();
  }

  async function removeIngredient(idx) {
    const copy = [...ingredients];
    copy.splice(idx,1);
    setIngredients(copy);
  }

  async function removeRecipe() {
    if (!editing) return;
    
    Alert.alert(
      '🗑️ Eliminar receta',
      `¿Estás seguro de que deseas eliminar "${editing.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await storageDelete(editing.id);
            Alert.alert('✅ Eliminado', `"${editing.name}" ha sido eliminada`);
            navigation.goBack();
          }
        }
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Nombre de la receta</Text>
        <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="P. ej. Ensalada de atún" placeholderTextColor="#ccc" />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Agregar ingrediente</Text>
        <TextInput value={ingredientLine} onChangeText={setIngredientLine} style={styles.input} placeholder='Ej: "2 tomate" o "sal"' placeholderTextColor="#ccc" />
        <TouchableOpacity style={styles.addBtn} onPress={addIngredient}>
          <Text style={styles.addBtnIcon}>➕</Text>
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Ingredientes</Text>
        <FlatList
          data={ingredients}
          keyExtractor={(_,i)=>String(i)}
          renderItem={({item,index}) => (
            <View style={styles.ingredientRow}>
              <Text style={styles.ingredientText}>{item.amount ?? ''} {item.unit ?? ''} {item.name}</Text>
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
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, marginVertical: 0, borderRadius: 6, color: '#333', fontSize: 14 },
  addBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 10, borderRadius: 6, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  addBtnIcon: { fontSize: 18 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  ingredientText: { flex: 1, color: '#333', fontSize: 14 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18, color: '#FF6B6B' },
  buttons: { flexDirection: 'column', gap: 8, marginTop: 12 },
  saveBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveBtnIcon: { fontSize: 18 },
  deleteRecipeBtn: { backgroundColor: '#FF6B6B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtnIcon: { fontSize: 18 }
});