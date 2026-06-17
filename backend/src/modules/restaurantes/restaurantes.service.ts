import { db, storage } from '../../config/firebase';
import { Restaurante, Plato } from '../../shared/types';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errores';

export class RestaurantesService {

  // Crea un restaurante nuevo — un usuario solo puede tener uno
  async crear(propietarioId: string, datos: Omit<Restaurante, 'id' | 'propietarioId' | 'creadoEn' | 'activo'>): Promise<Restaurante> {

    // Verifica que el usuario no tenga ya un restaurante
    const existente = await db.collection('restaurantes')
      .where('propietarioId', '==', propietarioId)
      .limit(1)
      .get();

    if (!existente.empty) {
      throw new AppError('Ya tienes un restaurante registrado', 400, 'YA_EXISTE');
    }

    const nuevoRestaurante: Omit<Restaurante, 'id'> = {
      ...datos,
      propietarioId,
      activo: true,
      creadoEn: new Date(),
    };

    const ref = await db.collection('restaurantes').add(nuevoRestaurante);

    return { id: ref.id, ...nuevoRestaurante };
  }

  // Lista todos los restaurantes activos — para que el cliente pueda buscar
  async listar(): Promise<Restaurante[]> {
    const snapshot = await db.collection('restaurantes')
      .where('activo', '==', true)
      .orderBy('nombre')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Restaurante));
  }

  // Obtiene un restaurante por ID con su catálogo completo
  async obtenerPorId(restauranteId: string): Promise<Restaurante & { catalogo: Plato[] }> {
    const doc = await db.collection('restaurantes').doc(restauranteId).get();

    if (!doc.exists) {
      throw new NotFoundError('Restaurante');
    }

    // Obtiene el catálogo desde la subcolección
    const catalogoSnapshot = await db
      .collection('restaurantes')
      .doc(restauranteId)
      .collection('catalogo')
      .where('disponible', '==', true)
      .get();

    const catalogo: Plato[] = catalogoSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Plato));

    return {
      id: doc.id,
      ...doc.data(),
      catalogo,
    } as Restaurante & { catalogo: Plato[] };
  }

  // Obtiene el restaurante del propietario autenticado
  async obtenerMiRestaurante(propietarioId: string): Promise<Restaurante> {
    const snapshot = await db.collection('restaurantes')
      .where('propietarioId', '==', propietarioId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('Restaurante');
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Restaurante;
  }

  // Actualiza datos del restaurante — solo el propietario
  async actualizar(
    restauranteId: string,
    propietarioId: string,
    datos: Partial<Pick<Restaurante, 'nombre' | 'descripcion' | 'direccion' | 'logoUrl'>>
  ): Promise<void> {
    const doc = await db.collection('restaurantes').doc(restauranteId).get();

    if (!doc.exists) {
      throw new NotFoundError('Restaurante');
    }

    // Verifica que quien actualiza es el dueño
    if (doc.data()?.propietarioId !== propietarioId) {
      throw new ForbiddenError('No eres el propietario de este restaurante');
    }

    await db.collection('restaurantes').doc(restauranteId).update({
      ...datos,
      actualizadoEn: new Date(),
    });
  }

  // Genera una URL firmada para subir el logo a Cloud Storage
  // El cliente sube directamente a GCS sin pasar por el backend
  async generarUrlSubidaLogo(restauranteId: string, propietarioId: string): Promise<string> {
    const doc = await db.collection('restaurantes').doc(restauranteId).get();

    if (!doc.exists) throw new NotFoundError('Restaurante');
    if (doc.data()?.propietarioId !== propietarioId) {
      throw new ForbiddenError('No eres el propietario');
    }

    const bucket = storage.bucket(`streetbite-dev.firebasestorage.app`);
    const archivo = bucket.file(`restaurantes/${restauranteId}/logo.jpg`);

    const [url] = await archivo.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      contentType: 'image/jpeg',
    });

    // URL pública que quedará disponible después de la subida
    const urlPublica = `https://storage.googleapis.com/${bucket.name}/restaurantes/${restauranteId}/logo.jpg`;

    // Actualiza el logoUrl en Firestore anticipadamente
    await db.collection('restaurantes').doc(restauranteId).update({
      logoUrl: urlPublica,
    });

    return url;
  }

  // ---- CATÁLOGO ----

  async agregarPlato(
    restauranteId: string,
    propietarioId: string,
    plato: Omit<Plato, 'id'>
  ): Promise<Plato> {
    // Verifica propiedad
    const doc = await db.collection('restaurantes').doc(restauranteId).get();
    if (!doc.exists) throw new NotFoundError('Restaurante');
    if (doc.data()?.propietarioId !== propietarioId) {
      throw new ForbiddenError('No eres el propietario');
    }

    const nuevoPlato = { ...plato, disponible: true };
    const ref = await db
      .collection('restaurantes')
      .doc(restauranteId)
      .collection('catalogo')
      .add(nuevoPlato);

    return { id: ref.id, ...nuevoPlato };
  }

  async actualizarPlato(
    restauranteId: string,
    platoId: string,
    propietarioId: string,
    datos: Partial<Plato>
  ): Promise<void> {
    const restauranteDoc = await db.collection('restaurantes').doc(restauranteId).get();
    if (!restauranteDoc.exists) throw new NotFoundError('Restaurante');
    if (restauranteDoc.data()?.propietarioId !== propietarioId) {
      throw new ForbiddenError('No eres el propietario');
    }

    await db
      .collection('restaurantes')
      .doc(restauranteId)
      .collection('catalogo')
      .doc(platoId)
      .update({ ...datos, actualizadoEn: new Date() });
  }

  // Genera URL firmada para subir foto de un plato
  async generarUrlSubidaFotoPlato(
    restauranteId: string,
    platoId: string,
    propietarioId: string
  ): Promise<string> {
    const doc = await db.collection('restaurantes').doc(restauranteId).get();
    if (!doc.exists) throw new NotFoundError('Restaurante');
    if (doc.data()?.propietarioId !== propietarioId) {
      throw new ForbiddenError('No eres el propietario');
    }

    const bucket = storage.bucket(`streetbite-dev.firebasestorage.app`);
    const archivo = bucket.file(`restaurantes/${restauranteId}/platos/${platoId}.jpg`);

    const [url] = await archivo.getSignedUrl({
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000,
      contentType: 'image/jpeg',
    });

    const urlPublica = `https://storage.googleapis.com/${bucket.name}/restaurantes/${restauranteId}/platos/${platoId}.jpg`;

    await db
      .collection('restaurantes')
      .doc(restauranteId)
      .collection('catalogo')
      .doc(platoId)
      .update({ fotoUrl: urlPublica });

    return url;
  }
}

export const restaurantesService = new RestaurantesService();