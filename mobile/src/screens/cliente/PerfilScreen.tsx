import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';

export default function PerfilScreen() {
  const { usuario } = useAuth();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>🛍️</Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        <Text style={styles.rol}>Cliente</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      <View style={styles.seccion}>
        <TouchableOpacity style={styles.fila} onPress={handleLogout}>
          <Text style={styles.logoutTexto}>Cerrar sesión</Text>
          <Text style={styles.flecha}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: NARANJA,
    paddingTop: 70,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 4,
  },
  avatar: {
    width: 80, height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  avatarTexto: { fontSize: 36 },
  nombre: { fontSize: 22, fontWeight: '800', color: '#fff' },
  rol: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 3,
    borderRadius: 20, marginTop: 2,
  },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  seccion: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 4,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  logoutTexto: { fontSize: 15, fontWeight: '600', color: '#E74C3C' },
  flecha: { fontSize: 20, color: '#ccc' },
});