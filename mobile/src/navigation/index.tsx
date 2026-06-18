import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegistroScreen from '../screens/auth/RegistroScreen';
import ClienteNavigator from './ClienteNavigator';
import RestauranteNavigator from './RestauranteNavigator';
import DomiciliarioNavigator from './DomiciliarioNavigator';

const Stack = createNativeStackNavigator();

export default function Navigation() {
  const { usuario, firebaseUser, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  // Usuario autenticado en Firebase pero sin perfil aún en Firestore
  // Significa que está en medio del proceso de registro
  if (firebaseUser && !usuario) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Configurando tu cuenta...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!usuario ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
          </>
        ) : usuario.rol === 'cliente' ? (
          <Stack.Screen name="ClienteApp" component={ClienteNavigator} />
        ) : usuario.rol === 'restaurante' ? (
          <Stack.Screen name="RestauranteApp" component={RestauranteNavigator} />
        ) : (
          <Stack.Screen name="DomiciliarioApp" component={DomiciliarioNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 12,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
});