import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { api } from '../../services/api';
import { EstadoPedido } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { usePedidosRealtime } from '../../hooks/usePedidosRealtime';

const ESTADOS_LABEL: Record<EstadoPedido, string> = {
  creado: 'Creado', aceptado: 'Aceptado', en_preparacion: 'En preparación',
  listo: 'Listo', en_camino: 'En camino', entregado: 'Entregado', cancelado: 'Cancelado',
};

const ESTADOS_COLOR: Record<EstadoPedido, string> = {
  creado: '#888', aceptado: '#3498DB', en_preparacion: '#F39C12',
  listo: '#9B59B6', en_camino: '#2ECC71', entregado: '#27AE60', cancelado: '#E74C3C',
};

export default function EntregasScreen() {
  const { usuario } = useAuth();
  const { pedidos, cargando } = usePedidosRealtime('domiciliario', usuario?.uid || null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const marcarEntregado = async (pedidoId: string) => {
    Alert.alert('Confirmar entrega', '¿El cliente recibió el pedido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, entregado',
        onPress: async () => {
          try {
            setActualizando(pedidoId);
            await api.patch(`/pedidos/${pedidoId}/estado`, { estado: 'entregado' });
            Alert.alert('¡Entrega completada!', '¡Buen trabajo!');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el estado.');
          } finally {
            setActualizando(null);
          }
        },
      },
    ]);
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    );
  }

  const activos = pedidos.filter(p => p.estado === 'en_camino');
  const historial = pedidos.filter(p => p.estado === 'entregado' || p.estado === 'cancelado');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis entregas 📦</Text>
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
          <Text style={styles.liveTexto}>En vivo</Text>
        </View>
      </View>

      <FlatList
        data={[...activos, ...historial]}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={activos.length > 0 ? <Text style={styles.seccion}>En camino ahora</Text> : null}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>📋</Text>
            <Text style={styles.vacioTexto}>Sin entregas aún</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <>
            {index === activos.length && historial.length > 0 && (
              <Text style={styles.seccion}>Historial</Text>
            )}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: ESTADOS_COLOR[item.estado] + '20' }]}>
                  <Text style={[styles.badgeTexto, { color: ESTADOS_COLOR[item.estado] }]}>
                    {ESTADOS_LABEL[item.estado]}
                  </Text>
                </View>
                <Text style={styles.total}>${item.total.toLocaleString()}</Text>
              </View>

              <Text style={styles.label}>📍 Destino</Text>
              <Text style={styles.direccion}>{item.direccionEntrega}</Text>

              <Text style={styles.label}>📦 Items</Text>
              {item.items.map((it, idx) => (
                <Text key={idx} style={styles.itemTexto}>{it.cantidad}x {it.nombre}</Text>
              ))}

              {item.estado === 'en_camino' && (
                <TouchableOpacity
                  style={[styles.boton, actualizando === item.id && styles.botonDeshabilitado]}
                  onPress={() => marcarEntregado(item.id!)}
                  disabled={actualizando === item.id}
                >
                  {actualizando === item.id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.botonTexto}>✓ Marcar como entregado</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      />
    </View>
  );
}

const VERDE = '#2ECC71';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: VERDE,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  liveDot: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  liveDotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lista: { padding: 16, gap: 12 },
  seccion: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4, marginTop: 8 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTexto: { fontWeight: '700', fontSize: 12 },
  total: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  label: { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', marginTop: 4 },
  direccion: { fontSize: 14, color: '#333', fontWeight: '500' },
  itemTexto: { fontSize: 13, color: '#555' },
  boton: { backgroundColor: VERDE, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});