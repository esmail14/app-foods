import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Button, StyleSheet } from 'react-native';
import { getAllRecipes, deleteRecipe } from '../storage/storage';

export default function RecipeList({ navigation, route }) {
  const [recipes, setRecipes] = useState([]);
  const pickFor = route.params?.pickFor;
  const onPick = route.params?.onPick;

  useEffect(() => {
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation]);

  async function load() {
    const all = await getAllRecipes();
    setRecipes(all);
  }

  function openEditor(recipe) {
    navigation.navigate('EditRecipe', { recipe });
  }

  async function pick(recipe) {
    if (onPick) {
      onPick(recipe);
      navigation.goBack();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recetas</Text>
      </View>
      <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('EditRecipe')}>
        <Text style={styles.newBtnIcon}>➕</Text>
        <Text style={styles.newBtnText}>Nueva receta</Text>
      </TouchableOpacity>
      <FlatList
        data={recipes}
        keyExtractor={(r) => r.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.item} onPress={() => pickFor ? pick(item) : openEditor(item)}>
            <View style={styles.itemContent}>
              <View style={styles.itemText}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.ingredients.map(i => `${i.amount ?? ''} ${i.unit ?? ''} ${i.name}`).join(', ')}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>🍽</Text><Text style={styles.emptyText}>No hay recetas aún</Text></View>}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { backgroundColor: '#4ECDC4', padding: 16, paddingTop: 12 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '700' },
  newBtn: { backgroundColor: '#4ECDC4', margin: 12, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  newBtnIcon: { fontSize: 20 },
  item: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0' },
  itemContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemText: { flex: 1 },
  title: { fontWeight: '700', fontSize: 16, color: '#222' },
  sub: { color: '#999', fontSize: 13, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: '#999', fontSize: 16, marginTop: 12 },
  chevron: { fontSize: 20, color: '#ccc' }
});