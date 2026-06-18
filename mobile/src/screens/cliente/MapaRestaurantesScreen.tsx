import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { api } from '../../services/api';
import { Restaurante } from '../../shared/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

export default function MapaRestaurantesScreen() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [cargando, setCargando] = useState(true);
  const [restauranteSeleccionado, setRestauranteSeleccionado] = useState<Restaurante | null>(null);
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  useEffect(() => {
    const init = async () => {
      // Pide permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUbicacion({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } else {
        // Sin permisos — centra en Santa Marta por defecto
        setUbicacion({ lat: 11.2408, lng: -74.2110 });
      }

      // Carga restaurantes
      try {
        const res = await api.get<{ ok: boolean; data: Restaurante[] }>('/restaurantes');
        setRestaurantes(res.data);
      } catch (error) {
        Alert.alert('Error', 'No se pudieron cargar los restaurantes.');
      } finally {
        setCargando(false);
      }
    };

    init();
  }, []);

  const irAMiUbicacion = () => {
    if (!ubicacion || !mapRef.current) return;
    mapRef.current.animateToRegion({
      latitude: ubicacion.lat,
      longitude: ubicacion.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  if (cargando || !ubicacion) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={NARANJA} />
        <Text style={styles.cargandoTexto}>Cargando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapa}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: ubicacion.lat,
          longitude: ubicacion.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {restaurantes.map((r) => {
          // Coordenadas simuladas cerca del usuario para demo
          // En producción vendrían de Firestore con lat/lng reales
          const offset = restaurantes.indexOf(r);
          const lat = ubicacion.lat + (offset * 0.002) - 0.003;
          const lng = ubicacion.lng + (offset * 0.002) - 0.003;

          return (
            <Marker
              key={r.id}
              coordinate={{ latitude: lat, longitude: lng }}
              onPress={() => setRestauranteSeleccionado(r)}
            >
              {/* Pin personalizado */}
              <View style={[
                styles.pin,
                restauranteSeleccionado?.id === r.id && styles.pinActivo,
              ]}>
                <Text style={styles.pinEmoji}>🍽️</Text>
              </View>

              <Callout tooltip onPress={() => {
                navigation.navigate('DetalleRestaurante', { restaurante: r });
              }}>
                <View style={styles.callout}>
                  <Text style={styles.calloutNombre}>{r.nombre}</Text>
                  <Text style={styles.calloutDir} numberOfLines={1}>
                    📍 {r.direccion}
                  </Text>
                  <View style={styles.calloutBoton}>
                    <Text style={styles.calloutBotonTexto}>Ver menú →</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Botón mi ubicación */}
      <TouchableOpacity style={styles.miUbicacionBtn} onPress={irAMiUbicacion}>
        <Text style={styles.miUbicacionEmoji}>📍</Text>
      </TouchableOpacity>

      {/* Counter de restaurantes */}
      <View style={styles.counter}>
        <Text style={styles.counterTexto}>
          {restaurantes.length} restaurante{restaurantes.length !== 1 ? 's' : ''} cerca
        </Text>
      </View>
    </View>
  );
}

const NARANJA = '#FF6B35';

const styles = StyleSheet.create({
  container: { flex: 1 },
  centrado: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', gap: 12,
  },
  cargandoTexto: { fontSize: 14, color: '#888' },
  mapa: { width, height },
  pin: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: NARANJA,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pinActivo: {
    backgroundColor: NARANJA,
    transform: [{ scale: 1.2 }],
  },
  pinEmoji: { fontSize: 18 },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    gap: 4,
  },
  calloutNombre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  calloutDir: { fontSize: 12, color: '#888' },
  calloutBoton: {
    backgroundColor: NARANJA,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: 6,
  },
  calloutBotonTexto: { color: '#fff', fontWeight: '700', fontSize: 13 },
  miUbicacionBtn: {
    position: 'absolute',
    bottom: 32, right: 16,
    backgroundColor: '#fff',
    width: 48, height: 48,
    borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  miUbicacionEmoji: { fontSize: 22 },
  counter: {
    position: 'absolute',
    top: 60, alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  counterTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
});