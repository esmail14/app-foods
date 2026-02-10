import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { getMealsForWeek, getAllRecipes, getPantry, getShoppingListModifications, modifyShoppingListItem, clearShoppingListModifications } from '../storage/storage';
import { aggregateIngredients, subtractPantry } from '../utils/ingredients';
import { Logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'ShoppingList';

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 1;
  const monday = new Date(d.setDate(diff));
  monday.setHours(0,0,0,0);
  return monday;
}

export default function ShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      Logger.info(MODULE, 'Loading shopping list');
      const start = startOfWeek();
      const mealsByDate = await getMealsForWeek(start);
      
      Logger.debug(MODULE, 'Meals by date:', JSON.stringify(mealsByDate));
      
      // collect all recipes used
      const recipes = await getAllRecipes();
      
      // build array of ingredients from meals
      let allIngredients = [];
      Object.keys(mealsByDate).forEach(date => {
        const meals = mealsByDate[date];
        Object.keys(meals || {}).forEach(mt => {
          const m = meals[mt];
          Logger.debug(MODULE, 'Processing meal', { date, mealType: mt, meal: JSON.stringify(m) });
          if (m?.ingredients && Array.isArray(m.ingredients)) {
            Logger.debug(MODULE, 'Found ingredients', m.ingredients.length + ' items');
            allIngredients = allIngredients.concat(m.ingredients);
          }
        });
      });
      
      Logger.debug(MODULE, 'All ingredients collected', allIngredients.length + ' total');
      
      // Validar que haya ingredientes
      if (allIngredients.length === 0) {
        Logger.info(MODULE, 'No ingredients found for shopping list');
        setItems([]);
        setLoading(false);
        return;
      }
      
      const aggregated = aggregateIngredients(allIngredients);
      Logger.debug(MODULE, 'Aggregated ingredients', JSON.stringify(aggregated));
      const pantry = await getPantry();
      let final = subtractPantry(aggregated, pantry);
      
      // Apply modifications
      const mods = await getShoppingListModifications();
      
      final = final.map(item => {
        const key = item.name + (item.unit || '');
        const mod = mods[key];
        
        if (mod?.deleted) {
          return null; // Mark for removal
        }
        
        if (mod?.amount !== undefined) {
          return { ...item, totalAmount: mod.amount };
        }
        
        return item;
      }).filter(Boolean); // Remove deleted items
      
      Logger.info(MODULE, 'Shopping list loaded: ' + final.length + ' items');
      setItems(final);
      setLoading(false);
    } catch (error) {
      Logger.error(MODULE, 'Failed to load shopping list', error.message);
      Alert.alert('❌ Error', 'No se pudo cargar la lista de compra');
      console.error('Error loading shopping list:', error);
      setLoading(false);
    }
  }

  async function handleDeleteItem(item) {
    const key = item.name + (item.unit || '');
    try {
      await modifyShoppingListItem(key, { deleted: true });
      setItems(items.filter(i => i.name !== item.name || i.unit !== item.unit));
      Logger.info(MODULE, 'Item deleted', item.name);
    } catch (error) {
      Logger.error(MODULE, 'Error deleting item', error.message);
      Alert.alert('❌ Error', 'No se pudo eliminar el ingrediente');
    }
  }

  async function handleEditAmount(item) {
    setEditingItem(item);
    setEditAmount(String(item.totalAmount || 0));
  }

  async function saveEditAmount() {
    if (!editingItem) return;
    
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) {
      Alert.alert('⚠️ Error', 'Ingresa una cantidad válida');
      return;
    }

    const key = editingItem.name + (editingItem.unit || '');
    try {
      if (newAmount === 0) {
        // Si es 0, eliminar
        await modifyShoppingListItem(key, { deleted: true });
        setItems(items.filter(i => i.name !== editingItem.name || i.unit !== editingItem.unit));
      } else {
        // Si es mayor que 0, actualizar
        await modifyShoppingListItem(key, { amount: newAmount });
        setItems(items.map(i => 
          i.name === editingItem.name && i.unit === editingItem.unit
            ? { ...i, totalAmount: newAmount }
            : i
        ));
      }
      Logger.info(MODULE, 'Item updated', { name: editingItem.name, amount: newAmount });
      setEditingItem(null);
      setEditAmount('');
    } catch (error) {
      Logger.error(MODULE, 'Error saving amount', error.message);
      Alert.alert('❌ Error', 'No se pudo guardar los cambios');
    }
  }

  async function resetList() {
    Alert.alert(
      '⚠️ Confirmar',
      '¿Descartar todos los cambios y restaurar lista original?',
      [
        { text: 'Cancelar', onPress: () => {}, style: 'cancel' },
        {
          text: 'Descartar cambios',
          onPress: async () => {
            try {
              await clearShoppingListModifications();
              load();
              Logger.info(MODULE, 'Shopping list reset');
            } catch (error) {
              Logger.error(MODULE, 'Error resetting list', error.message);
              Alert.alert('❌ Error', 'No se pudo restaurar la lista');
            }
          },
          style: 'destructive'
        }
      ]
    );
  }

  async function addNewIngredient() {
    // Validar nombre
    if (!newIngredientName.trim()) {
      Alert.alert('⚠️ Error', 'Ingresa un nombre para el ingrediente');
      return;
    }

    // Validar cantidad
    const amount = parseFloat(newIngredientAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('⚠️ Error', 'Ingresa una cantidad válida (mayor a 0)');
      return;
    }

    // Crear nuevo ingrediente
    const newIngredient = {
      name: newIngredientName.trim(),
      totalAmount: amount,
      unit: newIngredientUnit.trim() || ''
    };

    // Agregar a la lista
    setItems([...items, newIngredient]);
    Logger.info(MODULE, 'Ingredient added', newIngredient.name);

    // Limpiar formulario
    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientUnit('');
    setShowAddForm(false);

    Alert.alert('✅ Éxito', `"${newIngredient.name}" agregado a la lista`);
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Cargando lista..." />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lista de la Compra</Text>
        <Text style={styles.subtitle}>Semana actual</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(it) => it.name + (it.unit||'')}
        renderItem={({item}) => (
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.rowContent}
              onPress={() => handleEditAmount(item)}
            >
              <Text style={styles.rowIcon}>✓</Text>
              <View style={styles.rowText}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.totalAmount ?? '?'} {item.unit ?? ''}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => handleDeleteItem(item)}
            >
              <Text style={styles.deleteBtnIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyText}>Sin items para comprar</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      
      {/* Modal para editar cantidad */}
      <Modal
        visible={editingItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar cantidad</Text>
            <Text style={styles.modalSubtitle}>{editingItem?.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Cantidad"
              placeholderTextColor="#ccc"
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="decimal-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setEditingItem(null)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn}
                onPress={saveEditAmount}
              >
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para agregar ingrediente */}
      <Modal
        visible={showAddForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar ingrediente</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del ingrediente"
              placeholderTextColor="#ccc"
              value={newIngredientName}
              onChangeText={setNewIngredientName}
            />
            <View style={styles.modalAddFormRow}>
              <TextInput
                style={[styles.modalInput, styles.modalInputSmall]}
                placeholder="Cantidad"
                placeholderTextColor="#ccc"
                value={newIngredientAmount}
                onChangeText={setNewIngredientAmount}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.modalInput, styles.modalInputSmall]}
                placeholder="Unidad (g, ml, etc)"
                placeholderTextColor="#ccc"
                value={newIngredientUnit}
                onChangeText={setNewIngredientUnit}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelBtn}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.modalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalSaveBtn}
                onPress={addNewIngredient}
              >
                <Text style={styles.modalBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
          <Text style={styles.addIcon}>➕</Text>
          <Text style={styles.addBtnText}>Agregar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshIcon}>🔄</Text>
          <Text style={styles.refreshBtnText}>Refrescar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetBtn} onPress={resetList}>
          <Text style={styles.resetIcon}>↩️</Text>
          <Text style={styles.resetBtnText}>Restaurar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#9B59B6', paddingHorizontal: 16, paddingVertical: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#e0e0e0', fontSize: 12, marginTop: 4 },
  row: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowContent: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: { fontSize: 18, color: '#4ECDC4', fontWeight: 'bold' },
  rowText: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#222' },
  itemQty: { fontSize: 13, color: '#999', marginTop: 2 },
  deleteBtn: { paddingLeft: 8 },
  deleteBtnIcon: { fontSize: 18, color: '#FF6B6B', fontWeight: 'bold' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 12 },
  bottomButtons: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 12 },
  addBtn: { flex: 0.8, backgroundColor: '#4ECDC4', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  addIcon: { fontSize: 18 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  refreshBtn: { flex: 1, backgroundColor: '#9B59B6', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  refreshIcon: { fontSize: 18 },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resetBtn: { flex: 1, backgroundColor: '#95a5a6', paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  resetIcon: { fontSize: 18 },
  resetBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, fontSize: 16, marginBottom: 16, color: '#333' },
  modalAddFormRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  modalInputSmall: { flex: 1, marginBottom: 0 },
  modalButtons: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { flex: 1, backgroundColor: '#95a5a6', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalSaveBtn: { flex: 1, backgroundColor: '#4ECDC4', paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 }
});