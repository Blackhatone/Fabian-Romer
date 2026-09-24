-- ==========================================================
-- SCRIPT SQL PARA BASE DE DATOS EN NEON (POSTGRESQL)
-- Proyecto: Recopilador de Cédulas de Campaña Electoral
-- ==========================================================

-- 1. Tabla principal de Cédulas Recopiladas
CREATE TABLE IF NOT EXISTS cedulas_recopiladas (
    id BIGSERIAL PRIMARY KEY,
    cedula VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150),
    telefono VARCHAR(50),
    seccional VARCHAR(100),
    observaciones TEXT,
    ip_origen VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índice para acelerar búsquedas por cédula
CREATE INDEX IF NOT EXISTS idx_cedula ON cedulas_recopiladas (cedula);

-- 3. Tabla para configuraciones de campaña (opcional)
CREATE TABLE IF NOT EXISTS configuracion_campana (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'principal',
    candidate_name VARCHAR(150),
    candidate_role VARCHAR(100),
    candidate_photo_url TEXT,
    background_url TEXT,
    header_logo_url TEXT,
    footer_logo_url TEXT,
    list_number VARCHAR(20),
    option_number VARCHAR(20),
    campaign_slogan VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentario informativo:
-- Copia y pega este contenido en el SQL Editor de tu consola de Neon (https://neon.tech)
