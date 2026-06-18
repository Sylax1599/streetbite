import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Restaurante } from '../shared/types';
import { useAuth } from '../context/AuthContext';

export function useRestauranteId() {
  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    if (usuario?.rol !== 'restaurante') {
      setCargando(false);
      return;
    }

    const cargar = async () => {
      try {
        const res = await api.get<{ ok: boolean; data: Restaurante }>(
          '/restaurantes/mi-restaurante'
        );
        setRestauranteId(res.data.id || null);
      } catch {
        setRestauranteId(null);
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [usuario]);

  return { restauranteId, cargando };
}