import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { api } from '../../services/api';
import { EstadoPedido } from '../../shared/types';
import { usePedidosRealtime } from '../../hooks/usePedidosRealtime';
import { useRestauranteId } from '../../hooks/useRestauranteId';

const TRANSICIONES: Partial<Record<EstadoPedido, { siguiente: EstadoPedido; label: string }>> = {
  creado: { siguiente: 'aceptado', label: 'Aceptar pedido' },
  aceptado: { siguiente: 'en_preparacion', label: 'Iniciar preparación' },
  en_preparacion: { siguiente: 'listo', label: 'Marcar como listo' },
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

const ESTADOS_LABEL: Record<EstadoPedido, string> = {
  creado: 'Nuevo pedido',
  aceptado: 'Aceptado',
  en_preparacion: 'En preparación',
  listo: 'Listo para recoger',
  en_camino: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export default function PedidosRestauranteScreen() {
  const { restauranteId, cargando: cargandoRestaurante } = useRestauranteId();
  const { pedidos, cargando: cargandoPedidos } = usePedidosRealtime('restaurante', restauranteId);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const cambiarEstado = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    try {
      setActualizando(pedidoId);
      await api.patch(`/pedidos/${pedidoId}/estado`, { estado: nuevoEstado });
      // No necesitamos recargar — el listener actualiza solo
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo actualizar el pedido.');
    } finally {
      setActualizando(null);
    }
  };

  const cancelarPedido = (pedidoId: string) => {
    Alert.alert('Cancelar pedido', '¿Seguro que quieres cancelar este pedido?', [
      { text: 'No', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cambiarEstado(pedidoId, 'cancelado') },
    ]);
  };

  if (cargandoRestaurante || cargandoPedidos) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={MORADO} />
      </View>
    );
  }

  if (!restauranteId) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacioEmoji}>🍳</Text>
        <Text style={styles.vacioTexto}>Aún no tienes restaurante registrado</Text>
        <Text style={styles.vacioSub}>Ve a la pestaña Perfil para crear tu restaurante</Text>
      </View>
    );
  }

  const ordenPrioridad: EstadoPedido[] = ['creado', 'aceptado', 'en_preparacion', 'listo'];
  const activos = pedidos
    .filter(p => ordenPrioridad.includes(p.estado))
    .sort((a, b) => ordenPrioridad.indexOf(a.estado) - ordenPrioridad.indexOf(b.estado));
  const historial = pedidos.filter(p => ['entregado', 'cancelado'].includes(p.estado));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Pedidos 🍳</Text>
        <View style={styles.headerRight}>
          {activos.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTexto}>{activos.length} activo{activos.length > 1 ? 's' : ''}</Text>
            </View>
          )}
          <View style={styles.liveDot}>
            <View style={styles.liveDotInner} />
            <Text style={styles.liveTexto}>En vivo</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={[...activos, ...historial]}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>📋</Text>
            <Text style={styles.vacioTexto}>Sin pedidos aún</Text>
            <Text style={styles.vacioSub}>Los nuevos pedidos aparecerán aquí al instante</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const transicion = TRANSICIONES[item.estado];
          const esActivo = ordenPrioridad.includes(item.estado);

          return (
            <>
              {index === activos.length && historial.length > 0 && (
                <Text style={styles.seccion}>Historial</Text>
              )}
              <View style={[styles.card, item.estado === 'creado' && styles.cardNuevo]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.estadoBadge, { backgroundColor: ESTADOS_COLOR[item.estado] + '20' }]}>
                    <Text style={[styles.estadoTexto, { color: ESTADOS_COLOR[item.estado] }]}>
                      {item.estado === 'creado' ? '🔔 ' : ''}{ESTADOS_LABEL[item.estado]}
                    </Text>
                  </View>
                  <Text style={styles.total}>${item.total.toLocaleString()}</Text>
                </View>

                <View style={styles.itemsContainer}>
                  <Text style={styles.label}>PEDIDO</Text>
                  {item.items.map((it, idx) => (
                    <View key={idx} style={styles.itemFila}>
                      <Text style={styles.itemCantidad}>{it.cantidad}x</Text>
                      <Text style={styles.itemNombre}>{it.nombre}</Text>
                      <Text style={styles.itemPrecio}>${(it.precio * it.cantidad).toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View>
                  <Text style={styles.label}>ENTREGA</Text>
                  <Text style={styles.direccion}>{item.direccionEntrega}</Text>
                  {item.notas && <Text style={styles.notas}>📝 {item.notas}</Text>}
                </View>

                {esActivo && transicion && (
                  <View style={styles.acciones}>
                    <TouchableOpacity
                      style={[
                        styles.botonAccion,
                        { backgroundColor: ESTADOS_COLOR[transicion.siguiente] },
                        actualizando === item.id && styles.botonDeshabilitado,
                      ]}
                      onPress={() => cambiarEstado(item.id!, transicion.siguiente)}
                      disabled={actualizando === item.id}
                    >
                      {actualizando === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.botonAccionTexto}>{transicion.label}</Text>
                      )}
                    </TouchableOpacity>

                    {['creado', 'aceptado'].includes(item.estado) && (
                      <TouchableOpacity
                        style={styles.botonCancelar}
                        onPress={() => cancelarPedido(item.id!)}
                        disabled={actualizando === item.id}
                      >
                        <Text style={styles.botonCancelarTexto}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </>
          );
        }}
      />
    </View>
  );
}

const MORADO = '#8E44AD';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 24 },
  header: {
    backgroundColor: MORADO,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeTexto: { color: '#fff', fontWeight: '700', fontSize: 12 },
  liveDot: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  liveDotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2ECC71' },
  liveTexto: { color: '#fff', fontSize: 11, fontWeight: '700' },
  lista: { padding: 16, gap: 12 },
  seccion: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 4 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  vacioSub: { fontSize: 13, color: '#aaa', textAlign: 'center' },
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
  cardNuevo: { borderWidth: 2, borderColor: '#F39C12' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estadoBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  estadoTexto: { fontWeight: '700', fontSize: 12 },
  total: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  itemsContainer: { gap: 4 },
  label: { fontSize: 11, fontWeight: '700', color: '#aaa', marginBottom: 4 },
  itemFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemCantidad: { fontSize: 14, fontWeight: '700', color: MORADO, width: 28 },
  itemNombre: { flex: 1, fontSize: 14, color: '#333' },
  itemPrecio: { fontSize: 13, color: '#888' },
  direccion: { fontSize: 14, color: '#333', fontWeight: '500' },
  notas: { fontSize: 13, color: '#888', marginTop: 4, fontStyle: 'italic' },
  acciones: { flexDirection: 'row', gap: 10 },
  botonAccion: { flex: 1, borderRadius: 12, padding: 13, alignItems: 'center' },
  botonAccionTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  botonCancelar: { borderRadius: 12, padding: 13, alignItems: 'center', borderWidth: 1.5, borderColor: '#E74C3C' },
  botonCancelarTexto: { color: '#E74C3C', fontWeight: '700', fontSize: 14 },
  botonDeshabilitado: { opacity: 0.6 },
});