import { ElectorRecord, CampaignConfig, CampaignImage } from '../types';

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  candidateName: 'JAIME HINTERLEITNER',
  candidateRole: 'CONCEJAL 2026',
  candidatePhotoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80',
  backgroundUrl: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=2000&q=80',
  listNumber: '1',
  optionNumber: '7',
  campaignSlogan: 'CAMBYRETÁ AVANZA CON VOS',
  logos: {
    topBadge: 'JAIME HINTERLEITNER CONCEJAL 2026',
    bottomBadge: 'CAMBYRETÁ AVANZA CON VOS',
    listBadge: 'LISTA 1 - OPCIÓN 7',
  },
};

export const INITIAL_ELECTORS: ElectorRecord[] = [
  {
    id: 'elec-1',
    cedula: '1234567',
    nombreApellido: 'Carlos Ramón Benítez González',
    barrio: 'Centro',
    localVotacion: 'Colegio Nacional Cambyretá',
    mesa: '4',
    orden: '118',
    responsable: 'Pedro Sanabria',
    nombres: 'Carlos Ramón',
    apellidos: 'Benítez González',
    distrito: 'Cambyretá',
    departamento: 'Itapúa',
  },
  {
    id: 'elec-2',
    cedula: '3456789',
    nombreApellido: 'María Elena Giménez de Maidana',
    barrio: 'San Francisco',
    localVotacion: 'Escuela Básica N° 512 San Francisco',
    mesa: '2',
    orden: '45',
    responsable: 'Lic. Gladys Duarte',
    nombres: 'María Elena',
    apellidos: 'Giménez de Maidana',
    distrito: 'Cambyretá',
    departamento: 'Itapúa',
  },
  {
    id: 'elec-3',
    cedula: '4567890',
    nombreApellido: 'Jorge Aníbal Rojas Silvero',
    barrio: 'Arroyo Porá',
    localVotacion: 'Liceo Técnico Arroyo Porá',
    mesa: '8',
    orden: '202',
    responsable: 'Marcos Benítez',
    nombres: 'Jorge Aníbal',
    apellidos: 'Rojas Silvero',
    distrito: 'Cambyretá',
    departamento: 'Itapúa',
  },
  {
    id: 'elec-4',
    cedula: '2345678',
    nombreApellido: 'Silvia Beatriz Acuña Martínez',
    barrio: 'San Rafael',
    localVotacion: 'Colegio Nacional San Rafael',
    mesa: '1',
    orden: '12',
    responsable: 'Claudia Fernández',
    nombres: 'Silvia Beatriz',
    apellidos: 'Acuña Martínez',
    distrito: 'Cambyretá',
    departamento: 'Itapúa',
  },
  {
    id: 'elec-5',
    cedula: '5678901',
    nombreApellido: 'Ramón Dionisio Valenzuela Vera',
    barrio: 'San Juan',
    localVotacion: 'Escuela Graduada N° 2187',
    mesa: '3',
    orden: '89',
    responsable: 'Pedro Sanabria',
    nombres: 'Ramón Dionisio',
    apellidos: 'Valenzuela Vera',
    distrito: 'Cambyretá',
    departamento: 'Itapúa',
  }
];

export const INITIAL_CAMPAIGN_IMAGES: CampaignImage[] = [
  {
    id: 'img-cand-1',
    type: 'candidato',
    title: 'Jaime Hinterleitner - Retrato Oficial',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1000&q=80',
    caption: 'Retrato de campaña con guayabera blanca para candidatura 2026',
    uploadedAt: '2026-08-05'
  },
  {
    id: 'img-bg-1',
    type: 'fondo',
    title: 'Vista Aérea Panorámica de Cambyretá',
    url: 'https://images.unsplash.com/photo-1519999482648-25049ddd37b1?auto=format&fit=crop&w=2000&q=80',
    caption: 'Fondo aéreo panorámico de la ciudad',
    uploadedAt: '2026-08-05'
  },
  {
    id: 'img-banner-1',
    type: 'volante',
    title: 'Afiche Oficial - Jaime Intendente Lista 1',
    url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80',
    caption: 'Banner publicitario para redes y cartelería',
    uploadedAt: '2026-08-05'
  }
];
