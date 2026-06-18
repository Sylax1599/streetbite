import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { api } from '../../services/api';
import { Restaurante } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import ImageUploadButton from '../../components/ImageUploadButton';
import * as Location from 'expo-location';

export default function PerfilRestauranteScreen() {
  const { usuario } = useAuth();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [creando, setCreando] = useState(false);

  // Form
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get<{ ok: boolean; data: Restaurante }>(
          '/restaurantes/mi-restaurante'
        );
        const data = res.data;

        if (data.logoUrl && !data.logoUrl.includes('?v=')) {
          data.logoUrl = `${data.logoUrl}?v=${Date.now()}`;
        }
        setRestaurante(res.data);
        setNombre(res.data.nombre);
        setDescripcion(res.data.descripcion);
        setDireccion(res.data.direccion);
      } catch (error) {
        // No tiene restaurante aún
        setRestaurante(null);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const crearRestaurante = async () => {
    if (!nombre.trim() || !descripcion.trim() || !direccion.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    try {
      setCreando(true);

      // Intenta obtener coordenadas reales
      let lat, lng;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      const res = await api.post<{ ok: boolean; data: Restaurante }>(
        '/restaurantes',
        { nombre: nombre.trim(), descripcion: descripcion.trim(), direccion: direccion.trim(), lat, lng }
      );
      setRestaurante(res.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el restaurante.');
    } finally {
      setCreando(false);
    }
  };

  const guardarCambios = async () => {
    if (!nombre.trim() || !descripcion.trim() || !direccion.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    try {
      setGuardando(true);
      await api.patch(`/restaurantes/${restaurante!.id}`, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
      });
      setRestaurante(prev => prev ? { ...prev, nombre, descripcion, direccion } : prev);
      setEditando(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el restaurante.');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={MORADO} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header perfil */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>🍳</Text>
        </View>
        <Text style={styles.nombreUsuario}>{usuario?.nombre}</Text>
        <Text style={styles.email}>{usuario?.email}</Text>
      </View>

      {!restaurante ? (
        /* Crear restaurante */
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Registra tu restaurante</Text>
          <Text style={styles.seccionSub}>
            Antes de gestionar pedidos necesitas crear tu restaurante.
          </Text>

          {[
            { label: 'Nombre del restaurante', value: nombre, set: setNombre, placeholder: 'Ej: Antojitos del Parque' },
            { label: 'Descripción', value: descripcion, set: setDescripcion, placeholder: 'Qué tipo de comida ofreces' },
            { label: 'Dirección', value: direccion, set: setDireccion, placeholder: 'Dirección del local' },
          ].map(campo => (
            <View key={campo.label} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{campo.label}</Text>
              <TextInput
                style={styles.input}
                value={campo.value}
                onChangeText={campo.set}
                placeholder={campo.placeholder}
                placeholderTextColor="#999"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.boton, creando && styles.botonDeshabilitado]}
            onPress={crearRestaurante}
            disabled={creando}
          >
            {creando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Crear restaurante</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* Info restaurante */
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Text style={styles.seccionTitulo}>Mi restaurante</Text>
            <TouchableOpacity onPress={() => setEditando(!editando)}>
              <Text style={styles.editarTexto}>{editando ? 'Cancelar' : 'Editar'}</Text>
            </TouchableOpacity>
          </View>

          {editando ? (
            <>
              {[
                { label: 'Nombre', value: nombre, set: setNombre },
                { label: 'Descripción', value: descripcion, set: setDescripcion },
                { label: 'Dirección', value: direccion, set: setDireccion },
              ].map(campo => (
                <View key={campo.label} style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>{campo.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={campo.value}
                    onChangeText={campo.set}
                    placeholderTextColor="#999"
                  />
                </View>
              ))}

              <ImageUploadButton
                urlActual={restaurante.logoUrl}
                endpoint={`/restaurantes/${restaurante.id}/logo`}
                onSubida={(url) => {
                  setRestaurante(prev => prev ? { ...prev, logoUrl: url } : prev);
                }}
                placeholder="🏪"
                aspect="landscape"
              />

              <TouchableOpacity
                style={[styles.boton, guardando && styles.botonDeshabilitado]}
                onPress={guardarCambios}
                disabled={guardando}
              >
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.botonTexto}>Guardar cambios</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {[
                { label: 'Nombre', valor: restaurante.nombre },
                { label: 'Descripción', valor: restaurante.descripcion },
                { label: 'Dirección', valor: restaurante.direccion },
              ].map(campo => (
                <View key={campo.label} style={styles.infoFila}>
                  <Text style={styles.infoLabel}>{campo.label}</Text>
                  <Text style={styles.infoValor}>{campo.valor}</Text>
                </View>
              ))}

              <ImageUploadButton
                urlActual={restaurante.logoUrl}
                endpoint={`/restaurantes/${restaurante.id}/logo`}
                onSubida={(url) => {
                  setRestaurante(prev => prev ? { ...prev, logoUrl: url } : prev);
                }}
                placeholder="🏪"
                aspect="landscape"
              />
            </>
          )}
        </View>
      )}

      {/* Cerrar sesión */}
      <View style={styles.seccion}>
        <TouchableOpacity
          style={styles.fila}
          onPress={() =>
            Alert.alert('Cerrar sesión', '¿Seguro?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Salir', style: 'destructive', onPress: () => signOut(auth) },
            ])
          }
        >
          <Text style={styles.logoutTexto}>Cerrar sesión</Text>
          <Text style={styles.flecha}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const MORADO = '#8E44AD';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  scroll: { paddingBottom: 40 },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: MORADO,
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
  nombreUsuario: { fontSize: 22, fontWeight: '800', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  seccion: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  seccionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seccionTitulo: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  seccionSub: { fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 18 },
  editarTexto: { color: MORADO, fontWeight: '700', fontSize: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  boton: {
    backgroundColor: MORADO,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  infoFila: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase' },
  infoValor: { fontSize: 15, color: '#1A1A1A', marginTop: 2 },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 4,
  },
  logoutTexto: { fontSize: 15, fontWeight: '600', color: '#E74C3C' },
  flecha: { fontSize: 20, color: '#ccc' },
});