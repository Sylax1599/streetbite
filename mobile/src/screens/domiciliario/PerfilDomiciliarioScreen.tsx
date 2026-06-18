import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, Switch,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PerfilDomiciliarioScreen() {
  const { usuario } = useAuth();
  const [disponible, setDisponible] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const toggleDisponibilidad = async (valor: boolean) => {
    try {
      setActualizando(true);
      await api.patch('/domicilios/disponibilidad', { disponible: valor });
      setDisponible(valor);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la disponibilidad.');
    } finally {
      setActualizando(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>🛵</Text>
        </View>
        <Text style={styles.nombre}>{usuario?.nombre}</Text>
        <Text style={styles.rol}>Domiciliario</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      <View style={styles.seccion}>
        <View style={styles.filaSwitch}>
          <View>
            <Text style={styles.switchLabel}>Disponible para entregas</Text>
            <Text style={styles.switchSub}>
              {disponible ? 'Recibirás notificaciones de pedidos' : 'No recibirás pedidos nuevos'}
            </Text>
          </View>
          <Switch
            value={disponible}
            onValueChange={toggleDisponibilidad}
            disabled={actualizando}
            trackColor={{ false: '#ddd', true: VERDE + '80' }}
            thumbColor={disponible ? VERDE : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.seccion}>
        <TouchableOpacity style={styles.fila} onPress={handleLogout}>
          <Text style={styles.filaTextoRojo}>Cerrar sesión</Text>
          <Text style={styles.flecha}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const VERDE = '#2ECC71';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  header: {
    backgroundColor: VERDE,
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
    overflow: 'hidden',
  },
  filaSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  switchSub: { fontSize: 12, color: '#888', marginTop: 2 },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  filaTextoRojo: { fontSize: 15, fontWeight: '600', color: '#E74C3C' },
  flecha: { fontSize: 20, color: '#ccc' },
});