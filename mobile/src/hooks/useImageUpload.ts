import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { api } from '../services/api';

interface UploadOptions {
  endpoint: string; // endpoint que genera la signed URL
  onSuccess: (urlPublica: string) => void;
}

export function useImageUpload() {
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const seleccionarYSubir = async ({ endpoint, onSuccess }: UploadOptions) => {
    // Pide permisos
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para subir imágenes.',
        [{ text: 'Entendido' }]
      );
      return;
    }

    // Abre la galería
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1, // calidad original — comprimimos nosotros
    });

    if (resultado.canceled) return;

    const imagenOriginal = resultado.assets[0];

    try {
      setSubiendo(true);
      setProgreso(10);

      // Comprime la imagen — max 1200px de ancho, 80% calidad
      const imagenComprimida = await ImageManipulator.manipulateAsync(
        imagenOriginal.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setProgreso(30);

      // Pide la signed URL al backend
      const res = await api.post<{ ok: boolean; data: { uploadUrl: string } }>(
        endpoint, {}
      );
      const { uploadUrl } = res.data;

      setProgreso(50);

      // Sube directamente a Cloud Storage
      const blob = await fetch(imagenComprimida.uri).then(r => r.blob());

      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      setProgreso(90);

      // Extrae la URL pública de la signed URL
      // La signed URL tiene el formato: https://storage.googleapis.com/bucket/path?token=...
      const urlPublica = `${uploadUrl.split('?')[0]}?v=${Date.now()}`;

      setProgreso(100);
      onSuccess(urlPublica);

      Alert.alert('✅ Imagen subida', 'La imagen se actualizó correctamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo subir la imagen.');
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  const tomarFoto = async ({ endpoint, onSuccess }: UploadOptions) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu cámara.');
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (resultado.canceled) return;

    const imagenOriginal = resultado.assets[0];

    try {
      setSubiendo(true);
      setProgreso(10);

      const imagenComprimida = await ImageManipulator.manipulateAsync(
        imagenOriginal.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      setProgreso(40);

      const res = await api.post<{ ok: boolean; data: { uploadUrl: string } }>(
        endpoint, {}
      );
      const { uploadUrl } = res.data;

      setProgreso(60);

      const blob = await fetch(imagenComprimida.uri).then(r => r.blob());
      await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/jpeg' },
        body: blob,
      });

      const urlPublica = uploadUrl.split('?')[0];
      setProgreso(100);
      onSuccess(urlPublica);
      Alert.alert('✅ Foto subida', 'La foto se actualizó correctamente.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo subir la foto.');
    } finally {
      setSubiendo(false);
      setProgreso(0);
    }
  };

  // Muestra un ActionSheet para elegir entre galería y cámara
  const elegirFuente = ({ endpoint, onSuccess }: UploadOptions) => {
    Alert.alert(
      'Subir imagen',
      '¿De dónde quieres tomar la imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '📷 Tomar foto', onPress: () => tomarFoto({ endpoint, onSuccess }) },
        { text: '🖼️ Elegir de galería', onPress: () => seleccionarYSubir({ endpoint, onSuccess }) },
      ]
    );
  };

  return { elegirFuente, subiendo, progreso };
}