import React from 'react';
import {
  TouchableOpacity, View, Text, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useImageUpload } from '../hooks/useImageUpload';

interface Props {
  urlActual?: string | null;
  endpoint: string;
  onSubida: (url: string) => void;
  placeholder?: string;
  aspect?: 'square' | 'landscape';
}

export default function ImageUploadButton({
  urlActual, endpoint, onSubida, placeholder = '📷', aspect = 'landscape',
}: Props) {
  const { elegirFuente, subiendo, progreso } = useImageUpload();

  const handlePress = () => {
    elegirFuente({ endpoint, onSuccess: onSubida });
  };

  const alturaImagen = aspect === 'square' ? 120 : 160;

  return (
    <TouchableOpacity
      style={[styles.container, { height: alturaImagen }]}
      onPress={handlePress}
      disabled={subiendo}
      activeOpacity={0.85}
    >
      {urlActual ? (
        <Image
          source={{ uri: `${urlActual}?t=${Date.now()}` }}
          style={[styles.imagen, { height: alturaImagen }]}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>{placeholder}</Text>
          <Text style={styles.placeholderTexto}>Toca para agregar imagen</Text>
        </View>
      )}

      {/* Overlay cuando está subiendo */}
      {subiendo && (
        <View style={styles.overlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.overlayTexto}>Subiendo... {progreso}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progreso}%` }]} />
          </View>
        </View>
      )}

      {/* Badge de editar cuando hay imagen */}
      {urlActual && !subiendo && (
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeTexto}>✏️ Cambiar</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  imagen: { width: '100%' },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderEmoji: { fontSize: 36 },
  placeholderTexto: { fontSize: 13, color: '#888', fontWeight: '500' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  overlayTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
  progressBar: {
    width: '60%', height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  editBadge: {
    position: 'absolute',
    bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  editBadgeTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
});