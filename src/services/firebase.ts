import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import { CollectedCedula, CampaignConfig } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

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

/**
 * Save campaign configuration to cloud so all devices see the same banner & candidate info
 */
export async function saveCampaignConfigToCloud(config: CampaignConfig): Promise<void> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(docRef, {
      candidateName: config.candidateName,
      candidateRole: config.candidateRole,
      listNumber: config.listNumber,
      optionNumber: config.optionNumber || '7',
      campaignSlogan: config.campaignSlogan,
      candidatePhotoUrl: config.candidatePhotoUrl,
      backgroundUrl: config.backgroundUrl,
      headerLogoUrl: config.headerLogoUrl || '',
      footerLogoUrl: config.footerLogoUrl || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving campaign config to Cloud Firestore:', error);
  }
}

/**
 * Load campaign configuration from cloud
 */
export async function loadCampaignConfigFromCloud(): Promise<Partial<CampaignConfig> | null> {
  try {
    const snapshot = await getDocs(collection(db, CONFIG_COLLECTION));
    let cloudConfig: Partial<CampaignConfig> | null = null;
    snapshot.forEach((d) => {
      if (d.id === CONFIG_DOC_ID) {
        cloudConfig = d.data() as Partial<CampaignConfig>;
      }
    });
    return cloudConfig;
  } catch (error) {
    console.error('Error loading campaign config from Cloud Firestore:', error);
    return null;
  }
}
