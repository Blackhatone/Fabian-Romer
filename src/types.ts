export interface CollectedCedula {
  id: string;
  cedula: string;
  nombre?: string;
  barrio?: string;
  localVotacion?: string;
  mesa?: string | number;
  orden?: string | number;
  responsable?: string;
  telefono?: string;
  seccional?: string;
  observaciones?: string;
  pasoPorMesa?: boolean;
  horaVoto?: string;
  puestoControl?: string; // Puesto de Control (PC) desde el cual se registró
  registradoPor?: string;
  createdAt: string;
}

export interface AdminSecurityConfig {
  passwordHash: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ElectorRecord {
  id?: string;
  cedula: string; // C.I.N°
  nombreApellido: string; // Nombre y Apellido
  barrio: string; // Barrio
  localVotacion: string; // Local de Votación
  mesa: string | number; // Mesa
  orden: string | number; // Orden
  responsable?: string; // Responsable
  // Optional / backward-compatible fields
  nombres?: string;
  apellidos?: string;
  direccionLocal?: string;
  distrito?: string;
  departamento?: string;
  seccional?: string;
  listaRecomendada?: string;
  candidato?: string;
  fotoElectorUrl?: string;
}

export interface CampaignImage {
  id: string;
  type: 'candidato' | 'fondo' | 'logo' | 'banner' | 'volante' | 'galeria';
  title: string;
  url: string;
  caption?: string;
  uploadedAt: string;
}

export interface CampaignConfig {
  candidateName: string;
  candidateRole: string;
  candidatePhotoUrl: string;
  backgroundUrl: string;
  headerLogoUrl?: string; // Designed logo/image for Top Left (Name area)
  footerLogoUrl?: string; // Designed logo/image for Bottom Right (Slogan area)
  listNumber: string;
  optionNumber?: string;
  campaignSlogan: string;
  logos: {
    topBadge: string;
    bottomBadge: string;
    listBadge: string;
  };
}
