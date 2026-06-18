import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, Switch,
  Image, ScrollView,
} from 'react-native';
import { api } from '../../services/api';
import { Plato, Restaurante } from '../../shared/types';
import ImageUploadButton from '../../components/ImageUploadButton';

export default function CatalogoScreen() {
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [ultimoPlatoId, setUltimoPlatoId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [categoria, setCategoria] = useState('');

  const cargar = useCallback(async () => {
    try {
      const resRest = await api.get<{ ok: boolean; data: Restaurante }>(
        '/restaurantes/mi-restaurante'
      );
      setRestaurante(resRest.data);

      const resPlatos = await api.get<{ ok: boolean; data: Restaurante & { catalogo: Plato[] } }>(
        `/restaurantes/${resRest.data.id}`
      );
      setPlatos(resPlatos.data.catalogo);
    } catch (error) {
      console.error('Error cargando catálogo:', error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const resetForm = () => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setCategoria('');
    setUltimoPlatoId(null);
  };

  const cerrarModal = () => {
    resetForm();
    setModalVisible(false);
    cargar();
  };

  const agregarPlato = async () => {
    if (!nombre.trim() || !descripcion.trim() || !precio || !categoria.trim()) {
      Alert.alert('Campos requeridos', 'Completa todos los campos del plato.');
      return;
    }
    if (isNaN(Number(precio)) || Number(precio) <= 0) {
      Alert.alert('Precio inválido', 'Ingresa un precio válido.');
      return;
    }

    try {
      setGuardando(true);
      const res = await api.post<{ ok: boolean; data: { id: string } }>(
        `/restaurantes/${restaurante!.id}/catalogo`,
        {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          precio: Number(precio),
          categoria: categoria.trim(),
          disponible: true,
        }
      );
      // Plato creado — ahora mostramos el uploader de foto
      setUltimoPlatoId(res.data.id);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo agregar el plato.');
    } finally {
      setGuardando(false);
    }
  };

  const toggleDisponible = async (plato: Plato) => {
    try {
      await api.patch(
        `/restaurantes/${restaurante!.id}/catalogo/${plato.id}`,
        { disponible: !plato.disponible }
      );
      setPlatos(prev =>
        prev.map(p => p.id === plato.id ? { ...p, disponible: !p.disponible } : p)
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el plato.');
    }
  };

  if (cargando) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color={MORADO} />
      </View>
    );
  }

  if (!restaurante) {
    return (
      <View style={styles.centrado}>
        <Text style={styles.vacioEmoji}>🍽️</Text>
        <Text style={styles.vacioTexto}>Primero crea tu restaurante</Text>
        <Text style={styles.vacioSub}>Ve a la pestaña Perfil</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>Catálogo 🍽️</Text>
          <Text style={styles.subtitulo}>{restaurante.nombre}</Text>
        </View>
        <TouchableOpacity
          style={styles.botonAgregar}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.botonAgregarTexto}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={platos}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.vacio}>
            <Text style={styles.vacioEmoji}>🍽️</Text>
            <Text style={styles.vacioTexto}>Sin platos en el catálogo</Text>
            <Text style={styles.vacioSub}>Toca "+ Agregar" para crear tu primer plato</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Foto del plato */}
            {item.fotoUrl ? (
              <Image
                source={{ uri: item.fotoUrl }}
                style={styles.fotoPlato}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fotoPlaceholder}>
                <Text style={{ fontSize: 28 }}>🍽️</Text>
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.platoNombre}>{item.nombre}</Text>
              <Text style={styles.platoDesc} numberOfLines={2}>{item.descripcion}</Text>
              <View style={styles.platoMeta}>
                <Text style={styles.platoPrecio}>${item.precio.toLocaleString()}</Text>
                <Text style={styles.platoCategoria}>{item.categoria}</Text>
              </View>
            </View>

            <View style={styles.cardSwitch}>
              <Text style={styles.switchLabel}>
                {item.disponible ? 'Activo' : 'Inactivo'}
              </Text>
              <Switch
                value={item.disponible}
                onValueChange={() => toggleDisponible(item)}
                trackColor={{ false: '#ddd', true: MORADO + '80' }}
                thumbColor={item.disponible ? MORADO : '#f4f3f4'}
              />
            </View>
          </View>
        )}
      />

      {/* Modal agregar plato */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitulo}>
              {ultimoPlatoId ? 'Agregar foto' : 'Nuevo plato'}
            </Text>
            <TouchableOpacity onPress={cerrarModal}>
              <Text style={styles.modalCerrar}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalForm}>
            {!ultimoPlatoId ? (
              // ── Paso 1: formulario del plato ──
              <>
                {[
                  { label: 'Nombre del plato', value: nombre, set: setNombre, placeholder: 'Ej: Hamburguesa especial' },
                  { label: 'Descripción', value: descripcion, set: setDescripcion, placeholder: 'Ingredientes y detalles' },
                  { label: 'Precio', value: precio, set: setPrecio, placeholder: '0', keyboard: 'numeric' as const },
                  { label: 'Categoría', value: categoria, set: setCategoria, placeholder: 'Ej: Burgers, Bebidas...' },
                ].map((campo) => (
                  <View key={campo.label}>
                    <Text style={styles.label}>{campo.label}</Text>
                    <TextInput
                      style={styles.input}
                      value={campo.value}
                      onChangeText={campo.set}
                      placeholder={campo.placeholder}
                      placeholderTextColor="#999"
                      keyboardType={campo.keyboard || 'default'}
                    />
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
                  onPress={agregarPlato}
                  disabled={guardando}
                >
                  {guardando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.botonGuardarTexto}>Guardar plato →</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // ── Paso 2: foto del plato ──
              <>
                <View style={styles.pasoIndicador}>
                  <View style={[styles.paso, styles.pasoCompletado]}>
                    <Text style={styles.pasoTexto}>✓</Text>
                  </View>
                  <View style={styles.pasoLinea} />
                  <View style={[styles.paso, styles.pasoActivo]}>
                    <Text style={[styles.pasoTexto, { color: '#fff' }]}>2</Text>
                  </View>
                </View>

                <Text style={styles.pasoLabel}>Plato guardado ✅</Text>
                <Text style={styles.pasoSub}>
                  Ahora puedes agregar una foto para que los clientes lo vean mejor
                </Text>

                <ImageUploadButton
                  endpoint={`/restaurantes/${restaurante!.id}/catalogo/${ultimoPlatoId}/foto`}
                  onSubida={(url) => {
                    Alert.alert('¡Listo!', 'Plato creado con foto.');
                    cerrarModal();
                  }}
                  placeholder="🍽️"
                  aspect="landscape"
                />

                <TouchableOpacity
                  style={styles.botonSkip}
                  onPress={cerrarModal}
                >
                  <Text style={styles.botonSkipTexto}>Omitir foto por ahora</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const MORADO = '#8E44AD';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  centrado: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  header: {
    backgroundColor: MORADO,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titulo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  subtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  botonAgregar: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  botonAgregarTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lista: { padding: 16, gap: 12 },
  vacio: { alignItems: 'center', marginTop: 60, gap: 8 },
  vacioEmoji: { fontSize: 48 },
  vacioTexto: { fontSize: 16, fontWeight: '700', color: '#555' },
  vacioSub: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fotoPlato: {
    width: 90,
    height: 90,
  },
  fotoPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#F5F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1, gap: 3, paddingVertical: 12 },
  platoNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  platoDesc: { fontSize: 12, color: '#888', lineHeight: 17 },
  platoMeta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  platoPrecio: { fontSize: 15, fontWeight: '800', color: MORADO },
  platoCategoria: {
    fontSize: 11, color: '#999',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 10,
  },
  cardSwitch: { alignItems: 'center', gap: 4, paddingRight: 14 },
  switchLabel: { fontSize: 10, color: '#999' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  modalCerrar: { fontSize: 20, color: '#888' },
  modalForm: { padding: 20, gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 13,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  botonGuardar: {
    backgroundColor: MORADO,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  botonSkip: { alignItems: 'center', padding: 14 },
  botonSkipTexto: { color: '#aaa', fontSize: 14, fontWeight: '500' },
  pasoIndicador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 0,
  },
  paso: {
    width: 32, height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  pasoCompletado: { backgroundColor: '#2ECC71' },
  pasoActivo: { backgroundColor: MORADO },
  pasoTexto: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pasoLinea: {
    width: 40, height: 2,
    backgroundColor: '#E8E8E8',
  },
  pasoLabel: {
    fontSize: 16, fontWeight: '700',
    color: '#1A1A1A', textAlign: 'center',
  },
  pasoSub: {
    fontSize: 13, color: '#888',
    textAlign: 'center', lineHeight: 18,
  },
});