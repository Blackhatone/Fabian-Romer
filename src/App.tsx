import React, { useState, useEffect } from 'react';
import { DEFAULT_CAMPAIGN_CONFIG, INITIAL_CAMPAIGN_IMAGES, INITIAL_ELECTORS } from './data/mockPadron';
import { CampaignConfig, CollectedCedula, CampaignImage, ElectorRecord } from './types';
import { MainPadronView } from './components/MainPadronView';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { PasswordAuthModal } from './components/PasswordAuthModal';
import { normalizeCedula } from './utils/sheetParser';
import {
  saveCollectedCedulaToCloud,
  togglePasoPorMesaInCloud,
  subscribeToCollectedCedulas,
  deleteCollectedCedulaFromCloud,
  clearAllCollectedCedulasFromCloud,
  saveCampaignConfigToCloud,
  subscribeToCampaignConfig,
  saveElectorsToCloud,
  subscribeToElectors,
  testConnection,
} from './services/firebase';

export default function App() {
  // Campaign Configuration State (Candidate photo, background image, logos, slogan)
  const [campaign, setCampaign] = useState<CampaignConfig>(() => {
    try {
      const saved = localStorage.getItem('campaign_config_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_CAMPAIGN_CONFIG;
  });

  // LibreOffice / Excel Electors Padron Database State
  const [electors, setElectors] = useState<ElectorRecord[]>(() => {
    try {
      const saved = localStorage.getItem('padron_electores_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ELECTORS;
  });

  // Collected Cedulas Database State
  const [collectedCedulas, setCollectedCedulas] = useState<CollectedCedula[]>(() => {
    try {
      const saved = localStorage.getItem('collected_cedulas_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Additional Campaign Images Gallery
  const [campaignImages, setCampaignImages] = useState<CampaignImage[]>(() => {
    try {
      const saved = localStorage.getItem('campaign_images_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CAMPAIGN_IMAGES;
  });

  // Hidden Admin & Password Gate State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [operatorPuesto, setOperatorPuesto] = useState<string>(() => {
    return localStorage.getItem('operador_puesto_control') || 'PC 1';
  });

  const handleSetOperatorPuesto = (newPuesto: string) => {
    setOperatorPuesto(newPuesto);
    localStorage.setItem('operador_puesto_control', newPuesto);
  };

  // Sync campaign config to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('campaign_config_v1', JSON.stringify(campaign));
    } catch (e) {
      console.error(e);
    }
  }, [campaign]);

  // Sync electors database to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('padron_electores_v2', JSON.stringify(electors));
    } catch (e) {
      console.error(e);
    }
  }, [electors]);

  // Sync collected cedulas to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('collected_cedulas_v1', JSON.stringify(collectedCedulas));
    } catch (e) {
      console.error(e);
    }
  }, [collectedCedulas]);

  // Sync campaign images to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('campaign_images_v1', JSON.stringify(campaignImages));
    } catch (e) {
      console.error(e);
    }
  }, [campaignImages]);

  // Real-time Cloud Database synchronization (Firebase Firestore)
  useEffect(() => {
    // Check Firestore connection
    testConnection();

    // 1. Subscribe to Cloud Cedulas in real-time
    const unsubscribeCedulas = subscribeToCollectedCedulas((cloudCedulas) => {
      if (cloudCedulas && cloudCedulas.length > 0) {
        setCollectedCedulas(cloudCedulas);
      }
    });

    // 2. Subscribe to Cloud Campaign Config in real-time
    const unsubscribeCampaign = subscribeToCampaignConfig((cloudConfig) => {
      if (cloudConfig && cloudConfig.candidateName) {
        setCampaign(cloudConfig);
      }
    });

    // 3. Subscribe to Cloud Electors Padron in real-time
    const unsubscribeElectors = subscribeToElectors((cloudElectors) => {
      if (cloudElectors && cloudElectors.length > 0) {
        setElectors(cloudElectors);
      }
    });

    return () => {
      unsubscribeCedulas();
      unsubscribeCampaign();
      unsubscribeElectors();
    };
  }, []);

  // Search Elector by Cedula
  const handleSearchElector = (cedula: string): { found: boolean; elector?: ElectorRecord } => {
    const cleanQuery = normalizeCedula(cedula);
    if (!cleanQuery) return { found: false };

    const match = electors.find((e) => normalizeCedula(e.cedula) === cleanQuery);
    if (match) {
      return { found: true, elector: match };
    }
    return { found: false };
  };

  // Electors Database CRUD Handlers with Cloud Firestore Persistence
  const handleSetElectors = (newElectors: React.SetStateAction<ElectorRecord[]>) => {
    setElectors((prev) => {
      const next = typeof newElectors === 'function' ? newElectors(prev) : newElectors;
      saveElectorsToCloud(next);
      return next;
    });
  };

  const handleAddElector = (elector: ElectorRecord) => {
    setElectors((prev) => {
      const next = [elector, ...prev];
      saveElectorsToCloud(next);
      return next;
    });
  };

  const handleUpdateElector = (updated: ElectorRecord) => {
    setElectors((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      saveElectorsToCloud(next);
      return next;
    });
  };

  const handleDeleteElector = (id: string) => {
    setElectors((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveElectorsToCloud(next);
      return next;
    });
  };

  const handleClearElectors = () => {
    setElectors([]);
    saveElectorsToCloud([]);
  };

  const handleRestoreSampleElectors = () => {
    setElectors(INITIAL_ELECTORS);
    saveElectorsToCloud(INITIAL_ELECTORS);
  };

  // Save Cedula Handler (from Main Public Screen)
  const handleSaveCedula = (cedula: string): boolean => {
    const cleanCedula = normalizeCedula(cedula);
    if (!cleanCedula) return false;

    // Check if elector exists to enrich the record
    const match = electors.find((e) => normalizeCedula(e.cedula) === cleanCedula);

    const newRecord: CollectedCedula = {
      id: `ced-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cedula: cleanCedula,
      nombre: match ? match.nombreApellido : undefined,
      barrio: match ? match.barrio : undefined,
      localVotacion: match ? match.localVotacion : undefined,
      mesa: match ? match.mesa : undefined,
      orden: match ? match.orden : undefined,
      responsable: match ? match.responsable : undefined,
      observaciones: match
        ? `Local: ${match.localVotacion} | Mesa: ${match.mesa} | Orden: ${match.orden}`
        : 'Consultada / no encontrada en padrón',
      createdAt: new Date().toISOString(),
    };

    setCollectedCedulas((prev) => [newRecord, ...prev]);
    saveCollectedCedulaToCloud(newRecord);
    return true;
  };

  // Manual Add Cedula from Admin
  const handleAddManualCedula = (
    cedula: string,
    nombre?: string,
    telefono?: string,
    barrio?: string,
    localVotacion?: string,
    mesa?: string | number,
    orden?: string | number,
    responsable?: string
  ) => {
    const cleanCedula = normalizeCedula(cedula);
    const match = electors.find((e) => normalizeCedula(e.cedula) === cleanCedula);
    const newRecord: CollectedCedula = {
      id: `ced-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      cedula: cleanCedula,
      nombre: nombre || (match ? match.nombreApellido : undefined),
      telefono,
      barrio: barrio || (match ? match.barrio : undefined),
      localVotacion: localVotacion || (match ? match.localVotacion : undefined),
      mesa: mesa || (match ? match.mesa : undefined),
      orden: orden || (match ? match.orden : undefined),
      responsable: responsable || (match ? match.responsable : undefined),
      createdAt: new Date().toISOString(),
    };
    setCollectedCedulas((prev) => [newRecord, ...prev]);
    saveCollectedCedulaToCloud(newRecord);
  };

  // Delete Cedula from Database
  const handleDeleteCedula = (id: string) => {
    setCollectedCedulas((prev) => prev.filter((c) => c.id !== id));
    deleteCollectedCedulaFromCloud(id);
  };

  // Clear All Cedulas
  const handleClearCedulas = () => {
    setCollectedCedulas([]);
    clearAllCollectedCedulasFromCloud();
  };

  // Toggle Paso Por Mesa (Real-time vote tracking across all devices)
  const handleTogglePasoPorMesa = (
    record: CollectedCedula | ElectorRecord,
    status: boolean,
    operadorOrPC?: string
  ) => {
    const cleanCedula = normalizeCedula(record.cedula);
    const existing = collectedCedulas.find((c) => normalizeCedula(c.cedula) === cleanCedula);

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' });
    const activePC = operadorOrPC || operatorPuesto || 'PC 1';

    let updatedRecord: CollectedCedula;

    if (existing) {
      updatedRecord = {
        ...existing,
        pasoPorMesa: status,
        horaVoto: status ? `${timeFormatted} hs` : undefined,
        puestoControl: status ? (operadorOrPC || existing.puestoControl || activePC) : existing.puestoControl,
        registradoPor: status ? activePC : existing.registradoPor || `Mesa ${existing.mesa || 'General'}`,
      };
      setCollectedCedulas((prev) =>
        prev.map((c) => (normalizeCedula(c.cedula) === cleanCedula ? updatedRecord : c))
      );
    } else {
      const match = electors.find((e) => normalizeCedula(e.cedula) === cleanCedula) || (record as ElectorRecord);
      updatedRecord = {
        id: `ced-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        cedula: cleanCedula,
        nombre: match ? match.nombreApellido : (record as CollectedCedula).nombre,
        barrio: match ? match.barrio : (record as CollectedCedula).barrio,
        localVotacion: match ? match.localVotacion : (record as CollectedCedula).localVotacion,
        mesa: match ? match.mesa : (record as CollectedCedula).mesa,
        orden: match ? match.orden : (record as CollectedCedula).orden,
        responsable: match ? match.responsable : (record as CollectedCedula).responsable,
        pasoPorMesa: status,
        horaVoto: status ? `${timeFormatted} hs` : undefined,
        puestoControl: status ? activePC : undefined,
        registradoPor: activePC,
        createdAt: now.toISOString(),
      };
      setCollectedCedulas((prev) => [updatedRecord, ...prev]);
    }

    // Persist to Cloud Firestore so all users see it in real time
    togglePasoPorMesaInCloud(updatedRecord, status, activePC, activePC);
  };

  // Add new image to gallery
  const handleAddCampaignImage = (newImg: CampaignImage) => {
    setCampaignImages((prev) => [newImg, ...prev]);
  };

  // Delete image from gallery
  const handleDeleteCampaignImage = (id: string) => {
    setCampaignImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleOpenAdminGate = () => {
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = () => {
    setIsPasswordModalOpen(false);
    setIsAdminOpen(true);
  };

  return (
    <div className="tema-oscuro min-h-screen bg-slate-950 font-sans">
      {/* MAIN CLEAN VIEW: NO TOP BAR, SEARCHING ELECTORS IN LIBREOFFICE PADRON */}
      <MainPadronView
        campaign={campaign}
        electors={electors}
        collectedCedulas={collectedCedulas}
        onSearchElector={handleSearchElector}
        onSaveCedula={handleSaveCedula}
        onTogglePasoPorMesa={handleTogglePasoPorMesa}
        onOpenAdmin={handleOpenAdminGate}
        operatorPuesto={operatorPuesto}
        setOperatorPuesto={handleSetOperatorPuesto}
      />

      {/* PASSWORD PROTECTION GATE (SEALED ACCESS WITH PIN 2027) */}
      <PasswordAuthModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSuccess}
      />

      {/* HIDDEN ADMIN DASHBOARD MODAL */}
      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        campaign={campaign}
        setCampaign={setCampaign}
        electors={electors}
        setElectors={handleSetElectors}
        onAddElector={handleAddElector}
        onUpdateElector={handleUpdateElector}
        onDeleteElector={handleDeleteElector}
        onClearElectors={handleClearElectors}
        onRestoreSampleElectors={handleRestoreSampleElectors}
        collectedCedulas={collectedCedulas}
        onDeleteCedula={handleDeleteCedula}
        onClearCedulas={handleClearCedulas}
        onAddManualCedula={handleAddManualCedula}
        campaignImages={campaignImages}
        onAddCampaignImage={handleAddCampaignImage}
        onDeleteCampaignImage={handleDeleteCampaignImage}
      />
    </div>
  );
}
