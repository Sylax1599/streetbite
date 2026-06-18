import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export function usePedidosPendientes(restauranteId: string | null) {
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (!restauranteId) return;

    // Listener en tiempo real — cuenta pedidos en estado 'creado'
    const q = query(
      collection(db, 'pedidos'),
      where('restauranteId', '==', restauranteId),
      where('estado', '==', 'creado')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendientes(snapshot.size);
    }, (error) => {
      console.error('Error escuchando pedidos pendientes:', error);
    });

    return () => unsubscribe();
  }, [restauranteId]);

  return pendientes;
}