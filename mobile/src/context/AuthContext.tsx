import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { UsuarioApp } from '../shared/types';

interface AuthContextType {
  usuario: UsuarioApp | null;
  firebaseUser: User | null;
  cargando: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  firebaseUser: null,
  cargando: true,
  token: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<UsuarioApp | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Limpia el listener de Firestore anterior si existía
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (!user) {
        setFirebaseUser(null);
        setUsuario(null);
        setToken(null);
        setCargando(false);
        return;
      }

      setFirebaseUser(user);

      // Obtiene el token inicial
      const idToken = await user.getIdToken();
      setToken(idToken);

      // Escucha el documento de Firestore en tiempo real
      // Cuando el backend lo crea después del registro, esto dispara automáticamente
      unsubscribeFirestore = onSnapshot(
        doc(db, 'usuarios', user.uid),
        async (snap) => {
          if (snap.exists()) {
            // Primero refresca el token con los custom claims
            const tokenFresco = await user.getIdToken(true);
            setToken(tokenFresco);

            // Luego actualiza el usuario — así cuando Navigation
            // renderiza las pantallas el token ya tiene el rol
            const data = snap.data() as UsuarioApp;
            setUsuario(data);
          } else {
            setUsuario(null);
          }
          setCargando(false);
        },
        (error) => {
          console.error('Error escuchando usuario:', error);
          setCargando(false);
        }
      );

      setTimeout(async () => {
        const snap = await getDoc(doc(db, 'usuarios', user.uid));
        if (!snap.exists()) {
          console.warn('Documento de usuario no encontrado, cerrando sesión');
          await auth.signOut();
          setCargando(false);
        }
      }, 10000);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, firebaseUser, cargando, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);