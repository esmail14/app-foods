import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { addIngredientsFromRecipe } from '../storage/storage';
import { Logger } from '../utils/logger';
import LoadingSpinner from '../components/LoadingSpinner';

const MODULE = 'RecipeDetail';

export default function RecipeDetail({ navigation, route }) {
  const recipe = route.params?.recipe;
  const [servings, setServings] = useState(String(recipe?.servings || 4));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Receta no encontrada</Text>
      </View>
    );
  }

  const currentServings = parseInt(servings) || recipe.servings || 4;
  const scaleFactor = currentServings / (recipe.servings || 4);

  // Escalar ingredientes
  const scaledIngredients = recipe.ingredients.map(ing => ({
    ...ing,
    amount: ing.amount ? (ing.amount * scaleFactor).toFixed(2) : null
  }));

  const handleServingsChange = (value) => {
    const num = parseInt(value) || 0;
    if (num > 0) {
      setServings(String(num));
    }
  };

  const addToShoppingList = async () => {
    setLoading(true);
    try {
      await addIngredientsFromRecipe(scaledIngredients);
      Logger.info(MODULE, 'Ingredientes added to shopping list', { count: scaledIngredients.length, servings: currentServings });
      
      Alert.alert('Éxito', `${scaledIngredients.length} ingredientes agregados a la lista de compra`, [
        {
          text: 'Ir a lista',
          onPress: () => {
            navigation.navigate('ShoppingList');
          }
        },
        {
          text: 'Continuar',
          onPress: () => {}
        }
      ]);
    } catch (error) {
      Logger.error(MODULE, 'Error adding ingredients', error.message);
      Alert.alert('Error', 'No se pudieron agregar los ingredientes');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = () => {
    switch (recipe.difficulty) {
      case 'fácil':
        return '#4ECDc4';
      case 'media':
        return '#F39C12';
      case 'difícil':
        return '#FF6B6B';
      default:
        return '#95a5a6';
    }
  };

  const getDifficultyEmoji = () => {
    switch (recipe.difficulty) {
      case 'fácil':
        return '🟢';
      case 'media':
        return '🟡';
      case 'difícil':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <View style={styles.container}>
      <LoadingSpinner visible={loading} message="Cargando..." />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con nombre y favorito */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>↩️</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{recipe.name}</Text>
          <TouchableOpacity style={styles.favBtn}>
            <Text style={styles.favIcon}>❤️</Text>
          </TouchableOpacity>
        </View>

        {recipe.photoUri && (
          <View style={styles.photoSection}>
            <Image source={{ uri: recipe.photoUri }} style={styles.photo} />
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏰</Text>
            <View>
              <Text style={styles.infoLabel}>Tiempo</Text>
              <Text style={styles.infoValue}>{recipe.prepTime} min</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>{getDifficultyEmoji()}</Text>
            <View>
              <Text style={styles.infoLabel}>Dificultad</Text>
              <Text style={[styles.infoValue, { color: getDifficultyColor() }]}>
                {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🍴</Text>
            <View style={styles.servingsControl}>
              <Text style={styles.infoLabel}>Porciones</Text>
              <View style={styles.servingsButtons}>
                <TouchableOpacity
                  style={styles.servingsBtn}
                  onPress={() => handleServingsChange(String(Math.max(1, currentServings - 1)))}>
                  <Text style={styles.servingsBtnText}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.servingsInput}
                  value={servings}
                  onChangeText={handleServingsChange}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={styles.servingsBtn}
                  onPress={() => handleServingsChange(String(currentServings + 1))}>
                  <Text style={styles.servingsBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Ingredientes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Ingredientes</Text>
          {scaledIngredients.map((ing, idx) => (
            <View key={idx} style={styles.ingredientItem}>
              <Text style={styles.ingredientBullet}>•</Text>
              <Text style={styles.ingredientText}>
                {ing.amount ? `${ing.amount} ${ing.unit} ` : ''}{ing.name}
              </Text>
            </View>
          ))}
        </View>

        {/* Instrucciones */}
        {recipe.instructions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔪 Instrucciones</Text>
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addBtn} onPress={addToShoppingList}>
            <Text style={styles.addBtnIcon}>🛒</Text>
            <Text style={styles.addBtnText}>Agregar a lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editBtn} onPress={() => {
            navigation.navigate('EditRecipe', { recipe });
          }}>
            <Text style={styles.editBtnIcon}>✏️</Text>
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: '#333', marginLeft: 12 },
  favBtn: { padding: 8 },
  favIcon: { fontSize: 20 },
  photoSection: { width: '100%', height: 250, backgroundColor: '#e0e0e0', marginBottom: 12 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  infoCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, borderRadius: 8, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  infoDivider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 12 },
  infoIcon: { fontSize: 24 },
  infoLabel: { fontSize: 12, color: '#999', fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
  servingsControl: { flex: 1 },
  servingsButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 },
  servingsBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#4ECDc4', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 4 },
  servingsBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  servingsInput: { width: 40, height: 28, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, textAlign: 'center', color: '#333', fontWeight: '600' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, marginBottom: 12, padding: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  ingredientItem: { flexDirection: 'row', marginBottom: 8 },
  ingredientBullet: { fontSize: 16, color: '#4ECDc4', fontWeight: 'bold', width: 20 },
  ingredientText: { fontSize: 14, color: '#333', flex: 1 },
  instructionsText: { fontSize: 14, color: '#555', lineHeight: 22, fontFamily: 'Courier New' },
  actionButtons: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 20 },
  addBtn: { flex: 1, backgroundColor: '#4ECDc4', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  addBtnIcon: { fontSize: 18 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  editBtn: { flex: 1, backgroundColor: '#95a5a6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  editBtnIcon: { fontSize: 18 },
  editBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  errorText: { fontSize: 16, color: '#FF6B6B', textAlign: 'center', marginTop: 20 }
});