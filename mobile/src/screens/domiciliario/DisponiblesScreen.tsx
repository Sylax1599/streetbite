import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { api } from '../../services/api';
import { Pedido } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';

export default function DisponiblesScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [aceptando, setAceptando] = useState<string | null>(null);
  const { usuario } = useAuth();

  const cargar = useCallback(async () => {
    try {
      const res = await api.get<{ ok: boolean; data: Pedido[] }>('/domicilios/disponibles');
      setPedidos(res.data);
    } catch (error) {
      console.error('Error cargando pedidos disponibles:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    // Recarga cada 15 segundos automáticamente
    const intervalo = setInterval(cargar, 15000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  const aceptarPedido = async (pedidoId: string) => {
    Alert.alert(
      'Aceptar pedido',
      '¿Confirmas que vas a recoger y entregar este pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setAceptando(pedidoId);
              await api.post(`/domicilios/pedidos/${pedidoId}/aceptar`, {});
              Alert.alert('¡Pedido aceptado!', 'Ve a recoger el pedido al restaurante.');
              cargar();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo aceptar el pedido.');
            } finally {
              setAceptando(null);
            }
          },
        },
      ]
    );
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={VERDE} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Pedidos disponibles 🛵</Text>
        <Text style={styles.subtitulo}>
          {pedidos.length > 0
            ? `${pedidos.length} pedido${pedidos.length > 1 ? 's' : ''} esperando`
            : 'Sin pedidos por ahora'}
        </Text>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => { setRefrescando(true); cargar(); }}
            tintColor={VERDE}
          />
        }
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>🏍️</Text>
            <Text style={styles.vacioTexto}>No hay pedidos disponibles</Text>
            <Text style={styles.vacioSub}>Desliza hacia abajo para actualizar</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Info del pedido */}
            <View style={styles.cardHeader}>
              <View style={styles.badgeListo}>
                <Text style={styles.badgeTexto}>Listo para recoger</Text>
              </View>
              <Text style={styles.total}>${item.total.toLocaleString()}</Text>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.label}>📦 Items</Text>
              {item.items.map((it, idx) => (
                <Text key={idx} style={styles.item}>
                  {it.cantidad}x {it.nombre}
                </Text>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.label}>📍 Entregar en</Text>
              <Text style={styles.direccion}>{item.direccionEntrega}</Text>
            </View>

            <TouchableOpacity
              style={[styles.botonAceptar, aceptando === item.id && styles.botonDeshabilitado]}
              onPress={() => aceptarPedido(item.id!)}
              disabled={aceptando === item.id}
            >
              {aceptando === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.botonTexto}>Aceptar pedido</Text>
              )}
            </TouchableOpacity>
          </View>
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
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  lista: { padding: 16, gap: 12 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  vacioSub: { fontSize: 13, color: '#aaa' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeListo: {
    backgroundColor: '#EAFAF1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: { color: VERDE, fontWeight: '700', fontSize: 12 },
  total: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  cardBody: { gap: 4 },
  cardFooter: { gap: 4 },
  label: { fontSize: 12, fontWeight: '700', color: '#aaa', textTransform: 'uppercase' },
  item: { fontSize: 14, color: '#333' },
  direccion: { fontSize: 14, color: '#333', fontWeight: '500' },
  botonAceptar: {
    backgroundColor: VERDE,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});