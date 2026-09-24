import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { CollectedCedula, CampaignConfig, ElectorRecord } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { compressBase64Image } from '../utils/imageCompressor';

// Initialize Firebase App
const app = getApps().length === 0
  ? initializeApp({
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
    })
  : getApp();

// Initialize Firestore with named database
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const CEDULAS_COLLECTION = 'cedulas_recopiladas';
const CONFIG_COLLECTION = 'campaign_config';
const CONFIG_DOC_ID = 'current_campaign';
const PADRON_COLLECTION = 'padron_electores';
const ELECTORS_CHUNK_SIZE = 100;

// Test connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, CONFIG_COLLECTION, 'connection_check'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore: el cliente está en modo sin conexión.');
    }
    return false;
  }
}

// -------------------------------------------------------------
// CAMPAIGN CONFIGURATION (PHOTO, CANDIDATE NAME, LOGOS, SLOGAN)
// -------------------------------------------------------------

/**
 * Saves candidate configuration to Cloud Firestore.
 * Automatically verifies image sizes and optimizes them if needed.
 */
export async function saveCampaignConfigToCloud(
  config: CampaignConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Compress base64 images if they are present and large
    let optimizedPhoto = config.candidatePhotoUrl;
    let optimizedBg = config.backgroundUrl;
    let optimizedHeaderLogo = config.headerLogoUrl || '';
    let optimizedFooterLogo = config.footerLogoUrl || '';

    if (optimizedPhoto && optimizedPhoto.startsWith('data:image')) {
      optimizedPhoto = await compressBase64Image(optimizedPhoto, { maxWidth: 800, maxHeight: 800, quality: 0.78 });
    }
    if (optimizedBg && optimizedBg.startsWith('data:image')) {
      optimizedBg = await compressBase64Image(optimizedBg, { maxWidth: 1200, maxHeight: 800, quality: 0.72 });
    }
    if (optimizedHeaderLogo && optimizedHeaderLogo.startsWith('data:image')) {
      optimizedHeaderLogo = await compressBase64Image(optimizedHeaderLogo, { maxWidth: 800, maxHeight: 500, quality: 0.75 });
    }
    if (optimizedFooterLogo && optimizedFooterLogo.startsWith('data:image')) {
      optimizedFooterLogo = await compressBase64Image(optimizedFooterLogo, { maxWidth: 800, maxHeight: 500, quality: 0.75 });
    }

    const payload = {
      candidateName: String(config.candidateName || '').trim(),
      candidateRole: String(config.candidateRole || '').trim(),
      listNumber: String(config.listNumber || '').trim(),
      optionNumber: String(config.optionNumber || '7').trim(),
      campaignSlogan: String(config.campaignSlogan || '').trim(),
      candidatePhotoUrl: optimizedPhoto,
      backgroundUrl: optimizedBg,
      headerLogoUrl: optimizedHeaderLogo,
      footerLogoUrl: optimizedFooterLogo,
      logos: config.logos || {
        topBadge: `${config.candidateName} ${config.candidateRole}`,
        bottomBadge: config.campaignSlogan,
        listBadge: `LISTA ${config.listNumber} - OPCIÓN ${config.optionNumber || '7'}`,
      },
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, payload, { merge: true });
    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error guardando configuración de campaña en Firestore:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Real-time listener for Campaign Configuration.
 * Ensures that changes made from any device are instantly visible to all users.
 */
export function subscribeToCampaignConfig(
  onUpdate: (config: CampaignConfig) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.candidateName) {
            onUpdate({
              candidateName: data.candidateName,
              candidateRole: data.candidateRole || 'CONCEJAL 2026',
              listNumber: data.listNumber || '1',
              optionNumber: data.optionNumber || '7',
              campaignSlogan: data.campaignSlogan || '',
              candidatePhotoUrl: data.candidatePhotoUrl || '',
              backgroundUrl: data.backgroundUrl || '',
              headerLogoUrl: data.headerLogoUrl || '',
              footerLogoUrl: data.footerLogoUrl || '',
              logos: data.logos || {
                topBadge: `${data.candidateName} ${data.candidateRole || ''}`,
                bottomBadge: data.campaignSlogan || '',
                listBadge: `LISTA ${data.listNumber || '1'} - OPCIÓN ${data.optionNumber || '7'}`,
              },
            });
          }
        }
      },
      (error) => {
        console.warn('Real-time Campaign Config listener error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish real-time Campaign Config listener:', err);
    return () => {};
  }
}

/**
 * One-time load of Campaign Configuration.
 */
export async function loadCampaignConfigFromCloud(): Promise<CampaignConfig | null> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.candidateName) {
        return {
          candidateName: data.candidateName,
          candidateRole: data.candidateRole || 'CONCEJAL 2026',
          listNumber: data.listNumber || '1',
          optionNumber: data.optionNumber || '7',
          campaignSlogan: data.campaignSlogan || '',
          candidatePhotoUrl: data.candidatePhotoUrl || '',
          backgroundUrl: data.backgroundUrl || '',
          headerLogoUrl: data.headerLogoUrl || '',
          footerLogoUrl: data.footerLogoUrl || '',
          logos: data.logos || {
            topBadge: `${data.candidateName} ${data.candidateRole || ''}`,
            bottomBadge: data.campaignSlogan || '',
            listBadge: `LISTA ${data.listNumber || '1'} - OPCIÓN ${data.optionNumber || '7'}`,
          },
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error al cargar configuración de campaña de Firestore:', error);
    return null;
  }
}

// -------------------------------------------------------------
// PADRÓN ELECTORAL SYNCHRONIZATION (ELECTORS / VOTERS LIST)
// -------------------------------------------------------------

/**
 * Saves the full Electors Padron to Cloud Firestore in chunks so it is accessible
 * to all mobile phones and computers without manual file uploads on each device.
 */
export async function saveElectorsToCloud(
  electors: ElectorRecord[]
): Promise<{ success: boolean; totalSaved: number; error?: string }> {
  try {
    if (!electors || electors.length === 0) {
      // Clear cloud padron if empty
      const existing = await getDocs(collection(db, PADRON_COLLECTION));
      const batch = writeBatch(db);
      existing.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return { success: true, totalSaved: 0 };
    }

    // Chunk into groups of ELECTORS_CHUNK_SIZE
    const chunks: ElectorRecord[][] = [];
    for (let i = 0; i < electors.length; i += ELECTORS_CHUNK_SIZE) {
      chunks.push(electors.slice(i, i + ELECTORS_CHUNK_SIZE));
    }

    const batch = writeBatch(db);
    chunks.forEach((chunkItems, idx) => {
      const chunkRef = doc(db, PADRON_COLLECTION, `chunk_${idx}`);
      batch.set(chunkRef, {
        chunkIndex: idx,
        totalInChunk: chunkItems.length,
        items: chunkItems,
        updatedAt: new Date().toISOString(),
      });
    });

    // Delete any previous chunks that exceed the current count
    const existing = await getDocs(collection(db, PADRON_COLLECTION));
    existing.forEach((d) => {
      const match = d.id.match(/^chunk_(\d+)$/);
      if (match) {
        const chunkIndex = parseInt(match[1], 10);
        if (chunkIndex >= chunks.length) {
          batch.delete(d.ref);
        }
      }
    });

    await batch.commit();
    return { success: true, totalSaved: electors.length };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Error guardando padrón electoral en Firestore:', errorMsg);
    return { success: false, totalSaved: 0, error: errorMsg };
  }
}

/**
 * Real-time listener for Electors Padron.
 */
export function subscribeToElectors(
  onUpdate: (electors: ElectorRecord[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = collection(db, PADRON_COLLECTION);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          return;
        }
        const chunkDocs: { index: number; items: ElectorRecord[] }[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (Array.isArray(data.items)) {
            chunkDocs.push({
              index: typeof data.chunkIndex === 'number' ? data.chunkIndex : 0,
              items: data.items,
            });
          }
        });

        chunkDocs.sort((a, b) => a.index - b.index);
        const combined = chunkDocs.flatMap((c) => c.items);
        if (combined.length > 0) {
          onUpdate(combined);
        }
      },
      (error) => {
        console.warn('Realtime Electors subscription error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish real-time Electors listener:', err);
    return () => {};
  }
}

// -------------------------------------------------------------
// COLLECTED CEDULAS (VOTER LOOKUPS & TABLE STATUS TRACKING)
// -------------------------------------------------------------

/**
 * Save or update a collected cedula in Firestore (Cloud Database)
 */
export async function saveCollectedCedulaToCloud(record: CollectedCedula): Promise<void> {
  try {
    const cleanId = String(record.cedula).replace(/\D/g, '') || record.id;
    const docRef = doc(db, CEDULAS_COLLECTION, cleanId);
    await setDoc(docRef, {
      cedula: String(record.cedula),
      nombre: record.nombre || '',
      barrio: record.barrio || '',
      localVotacion: record.localVotacion || '',
      mesa: record.mesa !== undefined ? String(record.mesa) : '',
      orden: record.orden !== undefined ? String(record.orden) : '',
      responsable: record.responsable || '',
      telefono: record.telefono || '',
      observaciones: record.observaciones || '',
      pasoPorMesa: record.pasoPorMesa === true,
      horaVoto: record.horaVoto || '',
      registradoPor: record.registradoPor || '',
      createdAt: record.createdAt || new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving collected cedula to Cloud Firestore:', error);
  }
}

/**
 * Mark or unmark an elector as having voted/passed through the table in Cloud Firestore
 */
export async function togglePasoPorMesaInCloud(
  record: CollectedCedula,
  pasoPorMesa: boolean,
  mesaOperador?: string
): Promise<void> {
  try {
    const cleanId = String(record.cedula).replace(/\D/g, '') || record.id;
    const docRef = doc(db, CEDULAS_COLLECTION, cleanId);
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });

    await setDoc(docRef, {
      cedula: String(record.cedula),
      nombre: record.nombre || '',
      barrio: record.barrio || '',
      localVotacion: record.localVotacion || '',
      mesa: record.mesa !== undefined ? String(record.mesa) : '',
      orden: record.orden !== undefined ? String(record.orden) : '',
      responsable: record.responsable || '',
      telefono: record.telefono || '',
      observaciones: record.observaciones || '',
      pasoPorMesa,
      horaVoto: pasoPorMesa ? `${timeFormatted} hs` : '',
      registradoPor: mesaOperador || record.registradoPor || `Mesa ${record.mesa || 'General'}`,
      createdAt: record.createdAt || now.toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error toggling elector vote status in Cloud Firestore:', error);
  }
}

/**
 * Subscribe in real-time to collected cedulas from Firestore
 */
export function subscribeToCollectedCedulas(
  onUpdate: (cedulas: CollectedCedula[]) => void,
  onError?: (err: Error) => void
): () => void {
  try {
    const q = query(collection(db, CEDULAS_COLLECTION), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CollectedCedula[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
            cedula: data.cedula,
            nombre: data.nombre || undefined,
            barrio: data.barrio || undefined,
            localVotacion: data.localVotacion || undefined,
            mesa: data.mesa || undefined,
            orden: data.orden || undefined,
            responsable: data.responsable || undefined,
            telefono: data.telefono || undefined,
            observaciones: data.observaciones || undefined,
            pasoPorMesa: data.pasoPorMesa === true,
            horaVoto: data.horaVoto || undefined,
            registradoPor: data.registradoPor || undefined,
            createdAt: data.createdAt,
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Realtime subscription error, using local data fallback:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish real-time Firestore listener:', err);
    return () => {};
  }
}

/**
 * Delete a collected cedula from Firestore
 */
export async function deleteCollectedCedulaFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, CEDULAS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting collected cedula from Cloud Firestore:', error);
  }
}

/**
 * Clear all collected cedulas in batches from Firestore
 */
export async function clearAllCollectedCedulasFromCloud(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, CEDULAS_COLLECTION));
    const batch = writeBatch(db);
    snapshot.forEach((d) => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error clearing collected cedulas from Cloud Firestore:', error);
  }
}
