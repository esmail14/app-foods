import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView } from 'react-native';
import { saveRecipe, getAllRecipes, deleteRecipe as storageDelete } from '../storage/storage';
import { parseIngredientLine } from '../utils/ingredients';

export default function RecipeEditor({ navigation, route }) {
  const editing = route.params?.recipe;
  const [name, setName] = useState(editing?.name ?? '');
  const [ingredientLine, setIngredientLine] = useState('');
  const [ingredients, setIngredients] = useState(editing?.ingredients ?? []);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [editingAmount, setEditingAmount] = useState('');
  const [editingUnit, setEditingUnit] = useState('');

  const units = ['', 'g', 'kg', 'ml', 'l', 'taza', 'cucharada', 'cucharadita', 'unidad', 'paquete'];

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

  function openEditAmount(ingredient, idx) {
    setEditingIngredient(idx);
    setEditingAmount(ingredient.amount ? String(ingredient.amount) : '');
    setEditingUnit(ingredient.unit ?? '');
  }

  function saveAmount() {
    if (editingIngredient !== null) {
      const copy = [...ingredients];
      const amount = editingAmount.trim() ? Number(editingAmount) : null;
      copy[editingIngredient] = {
        ...copy[editingIngredient],
        amount,
        unit: editingUnit
      };
      setIngredients(copy);
      setEditingIngredient(null);
      setEditingAmount('');
      setEditingUnit('');
    }
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
              <TouchableOpacity 
                style={styles.ingredientContent}
                onPress={() => openEditAmount(item, index)}
              >
                <Text style={styles.ingredientText}>
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

      {/* Modal para editar cantidad */}
      <Modal
        visible={editingIngredient !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingIngredient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar cantidad</Text>
            {editingIngredient !== null && (
              <Text style={styles.modalSubtitle}>{ingredients[editingIngredient]?.name}</Text>
            )}
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Cantidad</Text>
              <TextInput
                value={editingAmount}
                onChangeText={setEditingAmount}
                style={styles.modalInput}
                placeholder="Ej: 2, 1.5, etc"
                keyboardType="decimal-pad"
                placeholderTextColor="#ccc"
              />
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Unidad</Text>
              <ScrollView horizontal style={styles.unitsContainer}>
                {units.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, editingUnit === u && styles.unitBtnActive]}
                    onPress={() => setEditingUnit(u)}
                  >
                    <Text style={[styles.unitBtnText, editingUnit === u && styles.unitBtnTextActive]}>
                      {u || 'Sin unidad'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditingIngredient(null)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveAmount}
              >
                <Text style={styles.modalSaveText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  ingredientContent: { flex: 1, paddingRight: 10 },
  ingredientText: { color: '#333', fontSize: 14 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18, color: '#FF6B6B' },
  buttons: { flexDirection: 'column', gap: 8, marginTop: 12 },
  saveBtn: { backgroundColor: '#4ECDC4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  saveBtnIcon: { fontSize: 18 },
  deleteRecipeBtn: { backgroundColor: '#FF6B6B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, padding: 14, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtnIcon: { fontSize: 18 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16, fontWeight: '600' },
  modalSection: { marginBottom: 16 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8, textTransform: 'uppercase' },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, color: '#333', fontSize: 14 },
  unitsContainer: { flexDirection: 'row', marginBottom: 8 },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', marginRight: 8, backgroundColor: '#f5f5f5' },
  unitBtnActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  unitBtnText: { color: '#333', fontSize: 13, fontWeight: '500' },
  unitBtnTextActive: { color: '#fff', fontWeight: '600' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalCancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f5f5f5' },
  modalCancelText: { color: '#333', fontWeight: '600', textAlign: 'center' },
  modalSaveBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, backgroundColor: '#4ECDC4' },
  modalSaveText: { color: '#fff', fontWeight: '600', textAlign: 'center' }
});