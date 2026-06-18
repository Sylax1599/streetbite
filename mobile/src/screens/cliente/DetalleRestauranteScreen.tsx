import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image,
} from 'react-native';
import { api } from '../../services/api';
import { Plato, Restaurante, ItemPedido } from '../../shared/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
};

export default function DetalleRestauranteScreen({ navigation, route }: Props) {
  const restaurante: Restaurante = route.params?.restaurante;
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [carrito, setCarrito] = useState<Record<string, number>>({});

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await api.get<{ ok: boolean; data: Restaurante & { catalogo: Plato[] } }>(
          `/restaurantes/${restaurante.id}`
        );
        setPlatos(res.data.catalogo);
      } catch (e) {
        Alert.alert('Error', 'No se pudo cargar el menú');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const agregarAlCarrito = (platoId: string) => {
    setCarrito(prev => ({ ...prev, [platoId]: (prev[platoId] || 0) + 1 }));
  };

  const quitarDelCarrito = (platoId: string) => {
    setCarrito(prev => {
      const nueva = { ...prev };
      if (nueva[platoId] > 1) nueva[platoId]--;
      else delete nueva[platoId];
      return nueva;
    });
  };

  const totalItems = Object.values(carrito).reduce((a, b) => a + b, 0);
  const totalPrecio = platos.reduce((acc, plato) => {
    return acc + (plato.precio * (carrito[plato.id!] || 0));
  }, 0);

  const irAlCarrito = () => {
    const items: ItemPedido[] = platos
      .filter(p => carrito[p.id!])
      .map(p => ({
        platoId: p.id!,
        nombre: p.nombre,
        precio: p.precio,
        cantidad: carrito[p.id!],
      }));

    navigation.navigate('Carrito', {
      restaurante,
      items,
      total: totalPrecio,
    });
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={NARANJA} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.nombre}>{restaurante.nombre}</Text>
          <Text style={styles.direccion}>📍 {restaurante.direccion}</Text>
        </View>
      </View>

      {/* Menú */}
      <FlatList
        data={platos}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={
          <Text style={styles.seccion}>Menú disponible</Text>
        }
        ListEmptyComponent={
          <Text style={styles.vacio}>Este restaurante aún no tiene platos disponibles</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.platoCard}>
            {item.fotoUrl ? (
              <Image source={{ uri: item.fotoUrl }} style={styles.fotoPlato} />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={{ fontSize: 24 }}>🍽️</Text>
              </View>
            )}
            <View style={styles.platoInfo}>
              <Text style={styles.platoNombre}>{item.nombre}</Text>
              <Text style={styles.platoDesc} numberOfLines={2}>{item.descripcion}</Text>
              <Text style={styles.platoPrecio}>${item.precio.toLocaleString()}</Text>
            </View>
            <View style={styles.contador}>
              {carrito[item.id!] ? (
                <>
                  <TouchableOpacity
                    style={styles.btnContador}
                    onPress={() => quitarDelCarrito(item.id!)}
                  >
                    <Text style={styles.btnContadorTexto}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.cantidad}>{carrito[item.id!]}</Text>
                </>
              ) : null}
              <TouchableOpacity
                style={[styles.btnContador, styles.btnAgregar]}
                onPress={() => agregarAlCarrito(item.id!)}
              >
                <Text style={[styles.btnContadorTexto, { color: '#fff' }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Botón carrito flotante */}
      {totalItems > 0 && (
        <TouchableOpacity style={styles.carritoBoton} onPress={irAlCarrito}>
          <View style={styles.carritoBadge}>
            <Text style={styles.carritoBadgeTexto}>{totalItems}</Text>
          </View>
          <Text style={styles.carritoTexto}>Ver carrito</Text>
          <Text style={styles.carritoTotal}>${totalPrecio.toLocaleString()}</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  back: { padding: 4 },
  backText: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerInfo: { flex: 1 },
  nombre: { fontSize: 20, fontWeight: '800', color: '#fff' },
  direccion: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  lista: { padding: 16, gap: 12, paddingBottom: 100 },
  seccion: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  vacio: { color: '#aaa', textAlign: 'center', marginTop: 32 },
  platoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fotoPlato: { width: 72, height: 72, borderRadius: 12 },
  fotoPlaceholder: {
    width: 72, height: 72, borderRadius: 12,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center', alignItems: 'center',
  },
  platoInfo: { flex: 1 },
  platoNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  platoDesc: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 17 },
  platoPrecio: { fontSize: 15, fontWeight: '800', color: NARANJA, marginTop: 4 },
  contador: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnContador: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1.5, borderColor: NARANJA,
    justifyContent: 'center', alignItems: 'center',
  },
  btnAgregar: { backgroundColor: NARANJA, borderColor: NARANJA },
  btnContadorTexto: { fontSize: 18, fontWeight: '700', color: NARANJA },
  cantidad: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', minWidth: 20, textAlign: 'center' },
  carritoBoton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: NARANJA,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: NARANJA,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  carritoBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 28, height: 28,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  carritoBadgeTexto: { color: NARANJA, fontWeight: '800', fontSize: 13 },
  carritoTexto: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 16 },
  carritoTotal: { color: '#fff', fontWeight: '800', fontSize: 16 },
});