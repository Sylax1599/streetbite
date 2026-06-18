import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import RestaurantesScreen from '../screens/cliente/RestaurantesScreen';
import DetalleRestauranteScreen from '../screens/cliente/DetalleRestauranteScreen';
import CarritoScreen from '../screens/cliente/CarritoScreen';
import PedidosScreen from '../screens/cliente/PedidosScreen';
import PerfilScreen from '../screens/cliente/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function RestaurantesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListaRestaurantes" component={RestaurantesScreen} />
      <Stack.Screen name="DetalleRestaurante" component={DetalleRestauranteScreen} />
      <Stack.Screen name="Carrito" component={CarritoScreen} />
    </Stack.Navigator>
  );
}

export default function ClienteNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: NARANJA,
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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Restaurantes: { active: 'compass', inactive: 'compass-outline' },
            'Mis Pedidos': { active: 'receipt', inactive: 'receipt-outline' },
            Perfil: { active: 'person-circle', inactive: 'person-circle-outline' },
          };
          const icon = icons[route.name];
          return (
            <Ionicons
              name={(focused ? icon.active : icon.inactive) as any}
              size={24}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Restaurantes"
        component={RestaurantesStack}
        options={{ tabBarLabel: 'Explorar' }}
      />
      <Tab.Screen
        name="Mis Pedidos"
        component={PedidosScreen}
        options={{ tabBarLabel: 'Pedidos' }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

const NARANJA = '#FF6B35';