import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { api } from '../../services/api';
import { Rol } from '../../shared/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const ROLES: { label: string; value: Rol; emoji: string; desc: string }[] = [
  { label: 'Cliente', value: 'cliente', emoji: '🛍️', desc: 'Busca y ordena comida' },
  { label: 'Restaurante', value: 'restaurante', emoji: '🍳', desc: 'Gestiona tu negocio' },
  { label: 'Domiciliario', value: 'domiciliario', emoji: '🛵', desc: 'Realiza entregas' },
];

export default function RegistroScreen({ navigation }: Props) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState<Rol | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos.');
      return;
    }
    if (!rolSeleccionado) {
      Alert.alert('Selecciona un rol', '¿Cómo vas a usar StreetBite?');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Mínimo 6 caracteres.');
      return;
    }

    try {
      setCargando(true);

      // 1. Crea el usuario en Firebase Auth
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2. Registra el perfil y asigna el rol en el backend
      // El token se agrega automáticamente en api.post
      await api.post('/auth/registro', {
        nombre: nombre.trim(),
        rol: rolSeleccionado,
      });

      // AuthContext detecta el nuevo usuario y navega automáticamente
    } catch (error: any) {
      const mensajes: Record<string, string> = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese email.',
        'auth/invalid-email': 'El email no es válido.',
        'auth/weak-password': 'La contraseña es muy débil.',
        'auth/network-request-failed': 'Sin conexión a internet.',
      };
      Alert.alert(
        'Error al registrarse',
        mensajes[error.code] || error.message || 'Ocurrió un error.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.titulo}>Crear cuenta</Text>
          <Text style={styles.subtitulo}>Únete a StreetBite</Text>
        </View>

        {/* Selección de rol */}
        <Text style={styles.label}>¿Cómo vas a usar la app?</Text>
        <View style={styles.rolesContainer}>
          {ROLES.map((rol) => (
            <TouchableOpacity
              key={rol.value}
              style={[
                styles.rolCard,
                rolSeleccionado === rol.value && styles.rolCardActivo,
              ]}
              onPress={() => setRolSeleccionado(rol.value)}
            >
              <Text style={styles.rolEmoji}>{rol.emoji}</Text>
              <Text style={[
                styles.rolLabel,
                rolSeleccionado === rol.value && styles.rolLabelActivo,
              ]}>
                {rol.label}
              </Text>
              <Text style={styles.rolDesc}>{rol.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Formulario */}
        <View style={styles.formulario}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Tu nombre"
            placeholderTextColor="#999"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#999"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleRegistro}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    color: NARANJA,
    fontSize: 16,
    fontWeight: '600',
  },
  titulo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitulo: {
    fontSize: 15,
    color: '#888',
    marginTop: 4,
  },
  rolesContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  rolCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  rolCardActivo: {
    borderColor: NARANJA,
    backgroundColor: '#FFF4F0',
  },
  rolEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  rolLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  rolLabelActivo: {
    color: NARANJA,
  },
  rolDesc: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  formulario: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  boton: {
    backgroundColor: NARANJA,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});