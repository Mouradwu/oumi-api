-- ==========================================
-- SCHÉMA COMPLET OUMI - PostgreSQL 18
-- ==========================================

-- Extension pour les UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des wilayas (division administrative niveau 1)
CREATE TABLE IF NOT EXISTS wilayas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);

-- Table des daïras (division administrative niveau 2)
CREATE TABLE IF NOT EXISTS dairas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    wilaya_code VARCHAR(10) REFERENCES wilayas(code) ON DELETE CASCADE
);

-- Table des communes (division administrative niveau 3)
-- NOTE: table créée mais NON peuplée. Aucune donnée fiable de commune
-- n'a été inventée ici : importez un jeu de données officiel (ONS/ANCT,
-- OpenStreetMap, GADM...) avant de vous appuyer sur cette table en prod.
CREATE TABLE IF NOT EXISTS communes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_fr VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    daira_code VARCHAR(10) REFERENCES dairas(code) ON DELETE CASCADE,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7)
);

-- Table des établissements de santé importés depuis OpenStreetMap (via
-- HOTOSM raw-data-api, licence ODbL). Distincte des tables hospitals/
-- clinics/pharmacies/transfusion_centers (qui restent pour des fiches
-- detaillees gerees manuellement) : celle-ci est le jeu de donnees brut
-- et complet utilise pour la recherche par wilaya/geolocalisation.
CREATE TABLE IF NOT EXISTS osm_health_facilities (
    id SERIAL PRIMARY KEY,
    osm_id BIGINT UNIQUE,
    category VARCHAR(20) NOT NULL, -- pharmacy | doctors | clinic | dentist | hospital
    name VARCHAR(255),
    name_ar VARCHAR(255),
    addr_city VARCHAR(255),
    wilaya_id INTEGER,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    specialty VARCHAR(255) -- pour category='doctors' : cardiologie, gynecologie, generaliste...
);

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50),
    phone VARCHAR(20),
    roles TEXT[] DEFAULT ARRAY['donor']::TEXT[],
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des donneurs
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    blood_type VARCHAR(5) NOT NULL,
    donation_types TEXT[],
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    availability_status VARCHAR(10) DEFAULT 'green',
    last_donation_date DATE,
    is_verified BOOLEAN DEFAULT false,
    certified BOOLEAN DEFAULT false,
    has_donated_before BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des receveurs
CREATE TABLE IF NOT EXISTS recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    wilaya_id INTEGER,
    commune_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des demandes de don
CREATE TABLE IF NOT EXISTS donation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id),
    blood_type VARCHAR(5) NOT NULL,
    donation_type VARCHAR(20) NOT NULL,
    wilaya_id INTEGER NOT NULL,
    commune_id INTEGER,
    hospital_name VARCHAR(255),
    service VARCHAR(100),
    urgency_level VARCHAR(20) DEFAULT 'normal',
    needed_date DATE,
    contact_phone VARCHAR(20),
    additional_info TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des matchs (mise en relation)
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES donation_requests(id) ON DELETE CASCADE,
    donor_id UUID REFERENCES donors(id) ON DELETE CASCADE,
    score DECIMAL(5, 2),
    distance_km DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des hôpitaux
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    type VARCHAR(50),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    phone_emergency VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    opening_hours TEXT,
    services TEXT[],
    blood_services BOOLEAN DEFAULT false,
    source VARCHAR(255),
    source_url TEXT,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des cliniques
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    services TEXT[],
    source VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des centres de transfusion
CREATE TABLE IF NOT EXISTS transfusion_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    daira_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    opening_hours TEXT,
    accepted_donation_types TEXT[],
    source VARCHAR(255),
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des pharmacies
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    wilaya_id INTEGER,
    commune_id INTEGER,
    address TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(20),
    opening_hours TEXT,
    is_on_duty BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des campagnes
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    organizer_id UUID REFERENCES users(id),
    organizer_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    wilaya_id INTEGER,
    commune_id INTEGER,
    location TEXT,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    donation_types TEXT[],
    description TEXT,
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des associations
CREATE TABLE IF NOT EXISTS associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255),
    admin_user_id UUID REFERENCES users(id),
    wilaya_id INTEGER,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des signalements
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des blocages
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID REFERENCES users(id),
    blocked_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_user_id)
);

-- Table des vérifications
CREATE TABLE IF NOT EXISTS verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(50),
    document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des journaux d'audit
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des consentements
CREATE TABLE IF NOT EXISTS consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN DEFAULT true,
    granted_at TIMESTAMP DEFAULT NOW(),
    revoked_at TIMESTAMP
);

-- Table des paramètres de l'application
CREATE TABLE IF NOT EXISTS app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertion des paramètres par défaut
INSERT INTO app_settings (key, value, description) VALUES
('matching_compatibility_weight', '40', 'Poids de la compatibilité dans le score de matching (%)'),
('matching_distance_weight', '25', 'Poids de la distance dans le score de matching (%)'),
('matching_availability_weight', '20', 'Poids de la disponibilité dans le score de matching (%)'),
('matching_verification_weight', '10', 'Poids de la vérification dans le score de matching (%)'),
('matching_urgency_weight', '5', 'Poids de l''urgence dans le score de matching (%)'),
('default_search_radius_km', '25', 'Rayon de recherche par défaut en km'),
('app_name_fr', 'OUMI', 'Nom de l''application en français'),
('app_name_ar', 'أمي', 'Nom de l''application en arabe'),
('slogan_fr', 'Donner une chance. Sauver une vie.', 'Slogan en français'),
('slogan_ar', 'كل قطرة دم حياة', 'Slogan en arabe')
ON CONFLICT (key) DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_donors_blood_type ON donors(blood_type);
CREATE INDEX IF NOT EXISTS idx_donors_wilaya ON donors(wilaya_id);
CREATE INDEX IF NOT EXISTS idx_donors_availability ON donors(availability_status);
CREATE INDEX IF NOT EXISTS idx_donation_requests_blood_type ON donation_requests(blood_type);
CREATE INDEX IF NOT EXISTS idx_donation_requests_urgency ON donation_requests(urgency_level);
CREATE INDEX IF NOT EXISTS idx_donation_requests_status ON donation_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Un meme expediteur ne peut avoir qu'une seule demande ACTIVE (non encore
-- acceptee) envers une meme personne. Index partiel : une fois acceptee
-- (data.accepted = true), la contrainte ne s'applique plus.
CREATE UNIQUE INDEX IF NOT EXISTS ux_notifications_active_request ON notifications (sender_id, user_id) WHERE type = 'request' AND (data->>'accepted') IS NULL AND sender_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_request ON matches(request_id);
CREATE INDEX IF NOT EXISTS idx_matches_donor ON matches(donor_id);

-- ==========================================
-- SCHÉMA OUMI CRÉÉ AVEC SUCCÈS
-- ==========================================
