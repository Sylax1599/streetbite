import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  TextInput, Image, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { Restaurante } from '../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapaRestaurantesScreen from './MapaRestaurantesScreen';

export default function RestaurantesScreen() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [filtrados, setFiltrados] = useState<Restaurante[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const { usuario } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [vistaLista, setVistaLista] = useState(true);

  const cargar = async () => {
    try {
      const res = await api.get<{ ok: boolean; data: Restaurante[] }>('/restaurantes');
      const data = res.data.map(r => ({
        ...r,
        logoUrl: r.logoUrl && !r.logoUrl.includes('?v=')
          ? `${r.logoUrl}?v=${Date.now()}`
          : r.logoUrl,
      }));
      setRestaurantes(data);
      setFiltrados(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!busqueda.trim()) { setFiltrados(restaurantes); return; }
    const q = busqueda.toLowerCase();
    setFiltrados(restaurantes.filter(r =>
      r.nombre.toLowerCase().includes(q) || r.descripcion.toLowerCase().includes(q)
    ));
  }, [busqueda, restaurantes]);

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={NARANJA} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.saludo}>Hola, {usuario?.nombre?.split(' ')[0]} 👋</Text>
            <Text style={styles.pregunta}>¿Qué se te antoja hoy?</Text>
          </View>
          <View style={styles.avatarSmall}>
            <Text style={{ fontSize: 20 }}>🛍️</Text>
          </View>
        </View>

        {/* Search bar dentro del header */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar restaurante..."
            placeholderTextColor="#999"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, vistaLista && styles.toggleBtnActivo]}
            onPress={() => setVistaLista(true)}
          >
            <Text style={[styles.toggleTexto, vistaLista && styles.toggleTextoActivo]}>
              ☰ Lista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, !vistaLista && styles.toggleBtnActivo]}
            onPress={() => setVistaLista(false)}
          >
            <Text style={[styles.toggleTexto, !vistaLista && styles.toggleTextoActivo]}>
              🗺️ Mapa
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista */}
      {vistaLista ? (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => { setRefrescando(true); cargar(); }}
              tintColor={NARANJA}
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {busqueda ? `${filtrados.length} resultado${filtrados.length !== 1 ? 's' : ''}` : 'Restaurantes cerca de ti'}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>Intenta con otro término</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('DetalleRestaurante', { restaurante: item })}
              activeOpacity={0.9}
            >
              {/* Imagen o placeholder con gradiente */}
              <View style={styles.cardImageContainer}>
                {item.logoUrl ? (
                  <Image
                    source={{ uri: item.logoUrl?.includes('?') ? item.logoUrl : `${item.logoUrl}?v=${Date.now()}` }}
                    style={styles.cardImage}
                  />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Text style={{ fontSize: 36 }}>🍽️</Text>
                  </View>
                )}
                <View style={styles.cardBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>Abierto</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.cardBody}>
                <Text style={styles.cardNombre}>{item.nombre}</Text>
                <Text style={styles.cardDesc} numberOfLines={1}>{item.descripcion}</Text>
                <View style={styles.cardFooter}>
                  <View style={styles.cardMeta}>
                    <Ionicons name="location-outline" size={12} color="#999" />
                    <Text style={styles.cardMetaText} numberOfLines={1}>{item.direccion}</Text>
                  </View>
                  <View style={styles.cardArrow}>
                    <Ionicons name="arrow-forward" size={14} color={NARANJA} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <MapaRestaurantesScreen />
      )}
    </View>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F7' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    backgroundColor: NARANJA,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  saludo: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  pregunta: { fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 2 },
  avatarSmall: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  lista: { padding: 16, paddingBottom: 32, gap: 14 },
  sectionTitle: {
    fontSize: 17, fontWeight: '700',
    color: '#1A1A1A', marginBottom: 4,
  },
  empty: { alignItems: 'center', marginTop: 48, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#555' },
  emptySub: { fontSize: 13, color: '#aaa' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardImageContainer: { position: 'relative' },
  cardImage: { width: '100%', height: 140 },
  cardImagePlaceholder: {
    width: '100%', height: 140,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center', alignItems: 'center',
  },
  cardBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ECC71' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardBody: { padding: 14, gap: 4 },
  cardNombre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  cardDesc: { fontSize: 13, color: '#888' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  cardMetaText: { fontSize: 12, color: '#999', flex: 1 },
  cardArrow: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFF4F0',
    justifyContent: 'center', alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
    alignSelf: 'center',
  },
  toggleBtn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },
  toggleBtnActivo: {
    backgroundColor: '#fff',
  },
  toggleTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleTextoActivo: {
    color: NARANJA,
  },
});