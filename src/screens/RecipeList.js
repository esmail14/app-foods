import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet, TextInput, Modal } from 'react-native';
import { getAllRecipes, deleteRecipe, updateRecipeFavorite } from '../storage/storage';
import { Logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'RecipeList';

export default function RecipeList({ navigation, route }) {
  const [recipes, setRecipes] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'newest', 'favorites'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const pickFor = route.params?.pickFor;
  const onPick = route.params?.onPick;

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  useEffect(() => {
    filterAndSortRecipes();
  }, [searchText, recipes, sortBy]);

  async function load() {
    try {
      setLoading(true);
      Logger.info(MODULE, 'Loading recipes');
      const all = await getAllRecipes();
      setRecipes(all);
      Logger.info(MODULE, 'Recipes loaded: ' + all.length + ' recipes');
    } catch (error) {
      Logger.error(MODULE, 'Failed to load recipes', error.message);
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortRecipes() {
    let filtered = recipes;
    
    // Filtrar por búsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      filtered = recipes.filter(r => 
        r.name.toLowerCase().includes(search) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(search))
      );
    }
    
    // Ordenar
    const sorted = [...filtered];
    if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === 'favorites') {
      sorted.sort((a, b) => {
        if (a.is_favorite === b.is_favorite) return 0;
        return a.is_favorite ? -1 : 1;
      });
    }
    
    setFilteredRecipes(sorted);
  }

  function checkDuplicateRecipeName(name) {
    return recipes.some(r => r.name.toLowerCase() === name.toLowerCase());
  }

  async function handleToggleFavorite(recipe) {
    try {
      Logger.info(MODULE, 'Toggling favorite', recipe.name);
      const newFavoriteState = !recipe.is_favorite;
      
      // Actualizar en Supabase
      await updateRecipeFavorite(recipe.id, newFavoriteState);
      
      // Actualizar en memoria
      const updated = { ...recipe, is_favorite: newFavoriteState };
      const newRecipes = recipes.map(r => r.id === recipe.id ? updated : r);
      setRecipes(newRecipes);
      
      Logger.info(MODULE, 'Favorite toggled', { recipe: recipe.name, isFavorite: newFavoriteState });
    } catch (error) {
      Logger.error(MODULE, 'Failed to toggle favorite', error.message);
    }
  }

  function openEditor(recipe) {
    navigation.navigate('EditRecipe', { recipe });
  }

  async function pick(recipe) {
    if (onPick) {
      onPick(recipe);
      navigation.goBack();
    } else if (pickFor) {
      // Usar el patrón de route.params para devolver la receta seleccionada
      navigation.navigate('WeekView', { selectedRecipe: recipe });
    }
  }

  async function handleDeleteRecipe(recipe) {
    setSelectedRecipe(recipe);
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!selectedRecipe) return;
    setLoading(true);
    try {
      Logger.info(MODULE, 'Deleting recipe', selectedRecipe.name);
      await deleteRecipe(selectedRecipe.id);
      Logger.info(MODULE, 'Recipe deleted successfully', selectedRecipe.name);
      setShowDeleteConfirm(false);
      setSelectedRecipe(null);
      await load();
    } catch (error) {
      Logger.error(MODULE, 'Failed to delete recipe', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Cargando..." />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Recetas</Text>
          <Text style={styles.recipeCount}>{recipes.length}</Text>
        </View>
        <TouchableOpacity 
          style={styles.sortBtn} 
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Text style={styles.sortBtnText}>
            {sortBy === 'name' ? '🔤 A-Z' : sortBy === 'newest' ? '📅 Nuevas' : '⭐ Favoritas'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
            onPress={() => { setSortBy('name'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortOptionText}>🔤 A-Z</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'newest' && styles.sortOptionActive]}
            onPress={() => { setSortBy('newest'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortOptionText}>📅 Más recientes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'favorites' && styles.sortOptionActive]}
            onPress={() => { setSortBy('favorites'); setShowSortMenu(false); }}
          >
            <Text style={styles.sortOptionText}>⭐ Favoritas</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          style={styles.searchInput}
          placeholder="Buscar receta o ingrediente..."
          placeholderTextColor="#ccc"
        />
        {searchText ? (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('EditRecipe')}>
        <Text style={styles.newBtnIcon}>➕</Text>
        <Text style={styles.newBtnText}>Nueva receta</Text>
      </TouchableOpacity>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(r) => r.id}
        renderItem={({item}) => (
          <TouchableOpacity 
            style={styles.item} 
            onPress={() => pickFor ? pick(item) : openEditor(item)}
            onLongPress={() => !pickFor && handleDeleteRecipe(item)}
          >
            <View style={styles.itemContent}>
              <View style={styles.itemText}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.ingredients.length} ingrediente{item.ingredients.length !== 1 ? 's' : ''}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => handleToggleFavorite(item)}
                style={styles.favBtn}
              >
                <Text style={styles.favIcon}>{item.is_favorite ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {recipes.length === 0 ? 'No hay recetas aún' : 'Sin resultados'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑️ Eliminar receta</Text>
            {selectedRecipe && (
              <Text style={styles.confirmText}>
                ¿Estás seguro de que deseas eliminar "{selectedRecipe.name}"?
              </Text>
            )}
            
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.confirmCancelBtn} 
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmDeleteBtn} 
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#4ECDC4', padding: 16, paddingTop: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  recipeCount: { color: '#fff', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  sortBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 8 },
  sortBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  sortMenu: { backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', overflow: 'hidden' },
  sortOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sortOptionActive: { backgroundColor: '#E8F9F7' },
  sortOptionText: { fontSize: 14, color: '#333', fontWeight: '500' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  searchIcon: { fontSize: 18, marginRight: 8, color: '#666' },
  searchInput: { 
    flex: 1, 
    paddingVertical: 10, 
    color: '#333',
    fontSize: 14
  },
  clearIcon: { fontSize: 18, color: '#ccc', fontWeight: 'bold' },
  newBtn: { backgroundColor: '#4ECDC4', marginHorizontal: 12, marginBottom: 12, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  newBtnIcon: { fontSize: 20 },
  item: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemText: { flex: 1 },
  title: { fontWeight: '700', fontSize: 16, color: '#222' },
  sub: { color: '#999', fontSize: 13, marginTop: 4 },
  favBtn: { padding: 8 },
  favIcon: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 12 },
  chevron: { fontSize: 20, color: '#ccc' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '85%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#222' },
  confirmText: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  confirmButtons: { flexDirection: 'row', gap: 12 },
  confirmCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', backgroundColor: '#f8f9fa' },
  confirmCancelText: { color: '#666', fontWeight: '600', textAlign: 'center' },
  confirmDeleteBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#FF6B6B' },
  confirmDeleteText: { color: '#fff', fontWeight: '600', textAlign: 'center' }
});