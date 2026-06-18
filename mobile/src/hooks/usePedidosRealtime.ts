import { useEffect, useState } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Pedido } from '../shared/types';

type FiltroTipo = 'cliente' | 'restaurante' | 'domiciliario';

export function usePedidosRealtime(tipo: FiltroTipo, id: string | null) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!id) {
      setCargando(false);
      return;
    }

    const campo = tipo === 'cliente' ? 'clienteId'
      : tipo === 'restaurante' ? 'restauranteId'
      : 'domiciliarioId';

    const q = query(
      collection(db, 'pedidos'),
      where(campo, '==', id),
      orderBy('creadoEn', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Pedido[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Pedido));
        setPedidos(data);
        setCargando(false);
      },
      (error) => {
        console.error(`Error escuchando pedidos (${tipo}):`, error);
        setCargando(false);
      }
    );

    return () => unsubscribe();
  }, [tipo, id]);

  return { pedidos, cargando };
}