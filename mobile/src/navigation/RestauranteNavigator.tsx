import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PedidosRestauranteScreen from '../screens/restaurante/PedidosRestauranteScreen';
import CatalogoScreen from '../screens/restaurante/CatalogoScreen';
import PerfilRestauranteScreen from '../screens/restaurante/PerfilRestauranteScreen';
import { usePedidosPendientes } from '../hooks/usePedidosPendientes';
import { useRestauranteId } from '../hooks/useRestauranteId';

const Tab = createBottomTabNavigator();
const MORADO = '#8E44AD';

// Componente del badge rojo
function Badge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeTexto}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export default function RestauranteNavigator() {
  const { restauranteId } = useRestauranteId();
  const pendientes = usePedidosPendientes(restauranteId);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: MORADO,
        tabBarInactiveTintColor: '#B0B0B0',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: 80,
          paddingBottom: 16,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const iconos: Record<string, string> = {
            Pedidos: focused ? '🔔' : '🔕',
            'Catálogo': focused ? '🍽️' : '🍽️',
            Perfil: focused ? '🏪' : '🏪',
          };
          return (
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 22 }}>{iconos[route.name]}</Text>
              {route.name === 'Pedidos' && (
                <Badge count={pendientes} />
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Pedidos"
        component={PedidosRestauranteScreen}
        options={{
          tabBarLabel: 'Pedidos',
          // Badge también en el label
          tabBarBadge: pendientes > 0 ? pendientes : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#E74C3C',
            fontSize: 11,
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen name="Catálogo" component={CatalogoScreen} />
      <Tab.Screen
        name="Perfil"
        component={PerfilRestauranteScreen}
        options={{ tabBarLabel: 'Mi local' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
});