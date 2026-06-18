import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import DisponiblesScreen from '../screens/domiciliario/DisponiblesScreen';
import EntregasScreen from '../screens/domiciliario/EntregasScreen';
import PerfilDomiciliarioScreen from '../screens/domiciliario/PerfilDomiciliarioScreen';

const Tab = createBottomTabNavigator();
const VERDE = '#2ECC71';

export default function DomiciliarioNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: VERDE,
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
          const icons: Record<string, { active: string; inactive: string }> = {
            Disponibles: { active: 'bicycle', inactive: 'bicycle-outline' },
            Entregas: { active: 'cube', inactive: 'cube-outline' },
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
        name="Disponibles"
        component={DisponiblesScreen}
        options={{ tabBarLabel: 'Disponibles' }}
      />
      <Tab.Screen
        name="Entregas"
        component={EntregasScreen}
        options={{ tabBarLabel: 'Mis entregas' }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilDomiciliarioScreen}
        options={{ tabBarLabel: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}