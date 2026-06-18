import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Props = { navigation: NativeStackNavigationProp<any> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa tu email y contraseña.');
      return;
    }
    try {
      setCargando(true);
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error: any) {
      const mensajes: Record<string, string> = {
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
        'auth/network-request-failed': 'Sin conexión a internet.',
      };
      Alert.alert('Error', mensajes[error.code] || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <Text style={styles.appName}>StreetBite</Text>
          <Text style={styles.tagline}>Comida de calle, a tu puerta</Text>
        </View>

        {/* Card formulario */}
        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Bienvenido de nuevo</Text>
          <Text style={styles.cardSub}>Inicia sesión para continuar</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#C0C0C0"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#C0C0C0"
                secureTextEntry={!verPassword}
              />
              <TouchableOpacity onPress={() => setVerPassword(!verPassword)}>
                <Ionicons
                  name={verPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDeshabilitado]}
            onPress={handleLogin}
            disabled={cargando}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.botonTexto}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          {/* Registro */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => navigation.navigate('Registro')}
          >
            <Text style={styles.linkTexto}>
              ¿No tienes cuenta?{'  '}
              <Text style={styles.linkAccion}>Regístrate gratis</Text>
            </Text>
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
    backgroundColor: NARANJA,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
    gap: 8,
  },
  logoCircle: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 44 },
  appName: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '400' },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    flex: 1,
    minHeight: 480,
    gap: 4,
  },
  cardTitulo: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  cardSub: { fontSize: 14, color: '#888', marginBottom: 20 },
  inputGroup: { gap: 6, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#EFEFEF',
    gap: 10,
  },
  inputIcon: {},
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  boton: {
    backgroundColor: NARANJA,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: NARANJA,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkContainer: { alignItems: 'center', marginTop: 20 },
  linkTexto: { fontSize: 14, color: '#888' },
  linkAccion: { color: NARANJA, fontWeight: '700' },
});