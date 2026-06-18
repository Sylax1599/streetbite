import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { api } from '../../services/api';
import { ItemPedido, Restaurante } from '../../shared/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function CarritoScreen({ navigation, route }: Props) {
  const restaurante: Restaurante = route.params?.restaurante;
  const itemsIniciales: ItemPedido[] = route.params?.items || [];
  const totalInicial: number = route.params?.total || 0;

  const [items, setItems] = useState<ItemPedido[]>(itemsIniciales);
  const [direccion, setDireccion] = useState('');
  const [notas, setNotas] = useState('');
  const [pidiendo, setPidiendo] = useState(false);

  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  const cambiarCantidad = (platoId: string, delta: number) => {
    setItems(prev => {
      const nuevos = prev.map(item =>
        item.platoId === platoId
          ? { ...item, cantidad: item.cantidad + delta }
          : item
      ).filter(item => item.cantidad > 0);
      return nuevos;
    });
  };

  const hacerPedido = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito vacío', 'Agrega al menos un plato.');
      return;
    }
    if (!direccion.trim()) {
      Alert.alert('Dirección requerida', '¿Dónde entregamos tu pedido?');
      return;
    }

    Alert.alert(
      'Confirmar pedido',
      `Total: $${total.toLocaleString()}\nEntregar en: ${direccion.trim()}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pedir ahora',
          onPress: async () => {
            try {
              setPidiendo(true);
              await api.post('/pedidos', {
                restauranteId: restaurante.id,
                items: items.map(({ platoId, cantidad }) => ({ platoId, cantidad })),
                direccionEntrega: direccion.trim(),
                notas: notas.trim() || undefined,
              });

              Alert.alert(
                '¡Pedido enviado! 🎉',
                'Tu pedido fue enviado al restaurante. Te notificaremos cuando esté en camino.',
                [{
                  text: 'Ver mis pedidos',
                  onPress: () => navigation.navigate('Mis Pedidos'),
                }]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo enviar el pedido.');
            } finally {
              setPidiendo(false);
            }
          },
        },
      ]
    );
  };

  if (items.length === 0) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacioEmoji}>🛒</Text>
        <Text style={styles.vacioTexto}>Tu carrito está vacío</Text>
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.botonVolverTexto}>← Volver al menú</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
            <Text style={styles.backTexto}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.titulo}>Tu pedido 🛒</Text>
            <Text style={styles.subtitulo}>{restaurante.nombre}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Items */}
          <Text style={styles.seccion}>Resumen</Text>
          {items.map((item) => (
            <View key={item.platoId} style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemNombre}>{item.nombre}</Text>
                <Text style={styles.itemPrecio}>
                  ${(item.precio * item.cantidad).toLocaleString()}
                </Text>
              </View>
              <View style={styles.contador}>
                <TouchableOpacity
                  style={styles.btnContador}
                  onPress={() => cambiarCantidad(item.platoId, -1)}
                >
                  <Text style={styles.btnContadorTexto}>−</Text>
                </TouchableOpacity>
                <Text style={styles.cantidad}>{item.cantidad}</Text>
                <TouchableOpacity
                  style={[styles.btnContador, styles.btnAgregar]}
                  onPress={() => cambiarCantidad(item.platoId, 1)}
                >
                  <Text style={[styles.btnContadorTexto, { color: '#fff' }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Dirección */}
          <Text style={styles.seccion}>¿Dónde entregamos?</Text>
          <TextInput
            style={styles.input}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Ingresa tu dirección completa"
            placeholderTextColor="#999"
            multiline
          />

          {/* Notas */}
          <Text style={styles.seccion}>Notas para el restaurante (opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputNotas]}
            value={notas}
            onChangeText={setNotas}
            placeholder="Sin cebolla, extra salsa, etc."
            placeholderTextColor="#999"
            multiline
          />

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total del pedido</Text>
            <Text style={styles.totalValor}>${total.toLocaleString()}</Text>
          </View>
        </ScrollView>

        {/* Botón pedir */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.botonPedir, pidiendo && styles.botonDeshabilitado]}
            onPress={hacerPedido}
            disabled={pidiendo}
          >
            {pidiendo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.botonPedirTexto}>Hacer pedido</Text>
                <Text style={styles.botonPedirTotal}>${total.toLocaleString()}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centrado: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  botonVolver: { marginTop: 8 },
  botonVolverTexto: { color: NARANJA, fontWeight: '700', fontSize: 15 },
  header: {
    backgroundColor: NARANJA,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: { padding: 4 },
  backTexto: { fontSize: 24, color: '#fff', fontWeight: '700' },
  titulo: { fontSize: 20, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  scroll: { padding: 16, gap: 8, paddingBottom: 32 },
  seccion: {
    fontSize: 13, fontWeight: '700',
    color: '#aaa', textTransform: 'uppercase',
    marginTop: 16, marginBottom: 8,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemInfo: { flex: 1 },
  itemNombre: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  itemPrecio: { fontSize: 14, color: NARANJA, fontWeight: '700', marginTop: 2 },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnContador: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1.5, borderColor: NARANJA,
    justifyContent: 'center', alignItems: 'center',
  },
  btnAgregar: { backgroundColor: NARANJA },
  btnContadorTexto: { fontSize: 18, fontWeight: '700', color: NARANJA },
  cantidad: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
  },
  inputNotas: { minHeight: 80, textAlignVertical: 'top' },
  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: NARANJA + '40',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalValor: { fontSize: 22, fontWeight: '800', color: NARANJA },
  footer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  botonPedir: {
    backgroundColor: NARANJA,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: NARANJA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonPedirTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  botonPedirTotal: { color: '#fff', fontWeight: '800', fontSize: 16 },
});