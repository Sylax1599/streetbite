import React from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { EstadoPedido } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { usePedidosRealtime } from '../../hooks/usePedidosRealtime';

const ESTADOS_LABEL: Record<EstadoPedido, string> = {
  creado: '🔔 Enviado al restaurante',
  aceptado: '✅ Aceptado por el restaurante',
  en_preparacion: '👨‍🍳 Preparando tu pedido',
  listo: '📦 Listo — buscando domiciliario',
  en_camino: '🛵 En camino a tu dirección',
  entregado: '✅ Entregado',
  cancelado: '❌ Cancelado',
};

const ESTADOS_COLOR: Record<EstadoPedido, string> = {
  creado: '#F39C12',
  aceptado: '#3498DB',
  en_preparacion: '#9B59B6',
  listo: '#2ECC71',
  en_camino: '#1ABC9C',
  entregado: '#27AE60',
  cancelado: '#E74C3C',
};

export default function PedidosScreen() {
  const { usuario } = useAuth();
  const { pedidos, cargando } = usePedidosRealtime('cliente', usuario?.uid || null);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={NARANJA} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Mis pedidos 📋</Text>
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
          <Text style={styles.liveTexto}>En vivo</Text>
        </View>
      </View>

      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>🛍️</Text>
            <Text style={styles.vacioTexto}>Aún no has hecho pedidos</Text>
            <Text style={styles.vacioSub}>Explora los restaurantes y haz tu primer pedido</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.estadoBadge,
                { backgroundColor: ESTADOS_COLOR[item.estado] + '18' }
              ]}>
                <Text style={[
                  styles.estadoTexto,
                  { color: ESTADOS_COLOR[item.estado] }
                ]}>
                  {ESTADOS_LABEL[item.estado]}
                </Text>
              </View>
              <Text style={styles.total}>${item.total.toLocaleString()}</Text>
            </View>

            <Text style={styles.label}>ITEMS</Text>
            {item.items.map((it, idx) => (
              <Text key={idx} style={styles.itemTexto}>
                {it.cantidad}x {it.nombre}
              </Text>
            ))}

            <Text style={styles.label}>DIRECCIÓN</Text>
            <Text style={styles.direccion}>{item.direccionEntrega}</Text>

            {item.notas && (
              <>
                <Text style={styles.label}>NOTAS</Text>
                <Text style={styles.notas}>{item.notas}</Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: NARANJA,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  liveDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  liveDotInner: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#2ECC71',
  },
  liveTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lista: { padding: 16, gap: 12 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  vacioSub: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
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
    marginBottom: 4,
  },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, flex: 1, marginRight: 8 },
  estadoTexto: { fontWeight: '700', fontSize: 12 },
  total: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  label: { fontSize: 11, fontWeight: '700', color: '#aaa', textTransform: 'uppercase', marginTop: 4 },
  itemTexto: { fontSize: 14, color: '#333' },
  direccion: { fontSize: 14, color: '#333', fontWeight: '500' },
  notas: { fontSize: 13, color: '#888', fontStyle: 'italic' },
});